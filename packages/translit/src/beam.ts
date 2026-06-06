/**
 * beam.ts — Runtime-agnostic beam decode logic
 *
 * This file contains the pure algorithmic core of the seq2seq beam search.
 * It is intentionally free of any ONNX runtime imports — those are injected
 * via the `runSession` callback, allowing the same logic to run on:
 *   - React Native  (onnxruntime-react-native)
 *   - Web           (onnxruntime-web)
 *   - Node.js       (onnxruntime-node, Vercel API route)
 *
 * Ported directly from bihung.org/src/lib/translit.js (Apache 2.0).
 */

import type tokenizer from '../assets/tokenizer.json'

export type Tokenizer = typeof tokenizer

export type TensorLike = {
  data: Float32Array
  dims: number[]
}

export type SessionRunFn = (inputs: Record<string, TensorLike>) => Promise<Record<string, TensorLike>>

export type MakeTensorFn = (data: Float32Array, dims: number[]) => TensorLike

// ── Pre-processing ────────────────────────────────────────────────────────────

/**
 * Expand under-specified nasal-geminate input.
 * "onga" → "ongga"  (doubles consonant after n/m before vowel)
 * Idempotent: "ongga" → "ongga" (no change)
 * Ported from bihung.org search.js
 */
export function expandNasalGeminate(s: string): string {
  return s.replace(/(?<=[nm])([gkdbptjcszfvrlh])(?=[aeiouwy])/gi, '$1$1')
}

// ── Tokenizer helpers ─────────────────────────────────────────────────────────

function encodeSeq(
  word: string,
  c2i: Record<string, number>,
  len: number
): Float32Array {
  const pad = 0
  const sos = c2i['<sos>']
  const eos = c2i['<eos>']
  const chars = Array.from(word).map(c => c2i[c] ?? pad)
  const t = [sos, ...chars, eos]
  while (t.length < len) t.push(pad)
  return new Float32Array(t.slice(0, len))
}

function makePadMask(seq: Float32Array, len: number, makeTensor: MakeTensorFn): TensorLike {
  const d = new Float32Array(len)
  for (let i = 0; i < len; i++) d[i] = seq[i] === 0 ? 1 : 0
  return makeTensor(d, [1, 1, 1, len])
}

function makeCausalMask(sz: number, makeTensor: MakeTensorFn): TensorLike {
  const d = new Float32Array(sz * sz)
  for (let i = 0; i < sz; i++)
    for (let j = 0; j < sz; j++)
      d[i * sz + j] = j > i ? 1 : 0
  return makeTensor(d, [1, 1, sz, sz])
}

// ── Beam search ───────────────────────────────────────────────────────────────

type Beam = { score: number; tokens: number[] }

/**
 * Beam decode a single word from Roman to Devanagari.
 *
 * @param word        Roman input word (lowercased, no spaces)
 * @param runSession  Platform-specific ONNX session.run() wrapper
 * @param makeTensor  Platform-specific Tensor constructor wrapper
 * @param tok         Tokenizer (from tokenizer.json)
 * @param K           Beam width (default 3)
 * @returns           Array of Devanagari candidates, best first
 */
export async function beamDecode(
  word: string,
  runSession: SessionRunFn,
  makeTensor: MakeTensorFn,
  tok: Tokenizer,
  K = 3
): Promise<string[]> {
  const inC2i  = tok.input.char2idx as Record<string, number>
  const tgtC2i = tok.target.char2idx as Record<string, number>
  const tgtI2c = tok.target.idx2char as Record<string, string>
  const maxIn  = tok.max_len_input
  const maxTgt = tok.max_len_target
  const SOS    = tgtC2i['<sos>']
  const EOS    = tgtC2i['<eos>']

  const encSeq  = encodeSeq(word.toLowerCase().replace(/\s+/g, ''), inC2i, maxIn)
  const encIn   = makeTensor(encSeq, [1, maxIn])
  const encMask = makePadMask(encSeq, maxIn, makeTensor)
  const laMask  = makeCausalMask(maxTgt, makeTensor)

  let beams: Beam[] = [{ score: 0, tokens: [SOS] }]

  for (let t = 0; t < maxTgt - 1; t++) {
    const candidates: Beam[] = []

    for (const beam of beams) {
      if (beam.tokens[beam.tokens.length - 1] === EOS) {
        candidates.push(beam)
        continue
      }

      const decArr = new Float32Array(maxTgt)
      beam.tokens.forEach((id, i) => { decArr[i] = id })

      const res = await runSession({
        enc_input:        makeTensor(encSeq, [1, maxIn]),
        dec_input:        makeTensor(decArr, [1, maxTgt]),
        enc_padding_mask: encMask,
        look_ahead_mask:  laMask,
        dec_padding_mask: encMask,
      })

      const logits = res['output_logits'].data as Float32Array
      const vocab  = logits.length / maxTgt
      const off    = (beam.tokens.length - 1) * vocab

      // Log-softmax
      let mx = -Infinity
      for (let v = 0; v < vocab; v++) if (logits[off + v] > mx) mx = logits[off + v]
      let sumExp = 0
      for (let v = 0; v < vocab; v++) sumExp += Math.exp(logits[off + v] - mx)
      const logSumExp = Math.log(sumExp) + mx

      const sc: [number, number][] = []
      for (let v = 0; v < vocab; v++) sc.push([v, logits[off + v] - logSumExp])
      sc.sort((a, b) => b[1] - a[1])

      for (let k = 0; k < K; k++) {
        const [tid, lp] = sc[k]
        candidates.push({ score: beam.score + lp, tokens: [...beam.tokens, tid] })
      }
    }

    candidates.sort((a, b) => b.score - a.score)
    beams = candidates.slice(0, K)
    if (beams.every(b => b.tokens[b.tokens.length - 1] === EOS)) break
  }

  return beams
    .map(b =>
      b.tokens
        .slice(1)
        .filter(id => id !== EOS && id !== 0)
        .map(id => tgtI2c[String(id)] ?? '')
        .join('')
    )
    .filter((t, i, a) => t && a.indexOf(t) === i)
}

/**
 * Full suggest pipeline — matches bihung.org translit.js schedSuggest logic:
 * 1. Beam decode the raw input
 * 2. Also beam decode the nasal-geminate expanded form
 * 3. Merge results, deduplicate
 */
export async function suggest(
  rawInput: string,
  runSession: SessionRunFn,
  makeTensor: MakeTensorFn,
  tok: Tokenizer,
  K = 3
): Promise<string[]> {
  if (!rawInput) return []
  if (/[\u0900-\u097F]/.test(rawInput)) return [] // already Devanagari

  const word     = rawInput.trim().toLowerCase().replace(/\s+/g, '')
  const expanded = expandNasalGeminate(word)

  const results = await beamDecode(word, runSession, makeTensor, tok, K)

  if (expanded !== word) {
    const extra = await beamDecode(expanded, runSession, makeTensor, tok, K)
    for (const r of extra) {
      if (!results.includes(r)) results.push(r)
    }
  }

  return results
}
