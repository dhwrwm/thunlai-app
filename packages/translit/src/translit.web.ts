/**
 * translit.web.ts — Web implementation (admin panel, Vite)
 *
 * Uses onnxruntime-web with WebAssembly backend.
 * ORT WASM files served from CDN (no bundle bloat).
 *
 * This file is picked automatically by Vite in apps/admin/
 * Metro picks translit.native.ts for React Native.
 *
 * Requirements:
 *   pnpm add onnxruntime-web (in apps/admin)
 */

import * as ort from 'onnxruntime-web'
import tokenizerData from '../assets/tokenizer.json'
import { suggest, expandNasalGeminate, type Tokenizer } from './beam'

// CDN WASM paths — no local WASM in bundle
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/'
ort.env.wasm.numThreads = 1

let session: ort.InferenceSession | null = null
let loadPromise: Promise<void> | null = null

async function ensureLoaded(): Promise<void> {
  if (session) return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      // model.onnx served as a Vite asset
      const modelUrl = new URL('../assets/model.onnx', import.meta.url).href
      session = await ort.InferenceSession.create(modelUrl)
    } catch (e) {
      console.warn('[translit] Failed to load model:', e)
    }
  })()

  return loadPromise
}

function makeTensor(data: Float32Array, dims: number[]) {
  return new ort.Tensor('float32', data, dims)
}

async function runSession(inputs: Record<string, any>) {
  await ensureLoaded()
  if (!session) throw new Error('Session not loaded')
  const feeds: Record<string, ort.Tensor> = {}
  for (const [key, val] of Object.entries(inputs)) {
    feeds[key] = new ort.Tensor('float32', val.data, val.dims)
  }
  return session.run(feeds)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function warmup(): Promise<void> {
  await ensureLoaded()
}

export async function transliterate(input: string): Promise<string[]> {
  try {
    await ensureLoaded()
    if (!session) return []
    return await suggest(input, runSession, makeTensor, tokenizerData as Tokenizer)
  } catch (e) {
    console.warn('[translit] Inference failed:', e)
    return []
  }
}

export async function transliterateBest(input: string): Promise<string> {
  const results = await transliterate(input)
  return results[0] ?? ''
}

export { expandNasalGeminate }
