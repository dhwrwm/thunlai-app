/**
 * translit.server.ts — Node.js / Vercel API route implementation
 *
 * Uses onnxruntime-node which links to native ONNX Runtime binaries.
 * This runs in Vercel serverless functions (Node.js runtime).
 *
 * Used by: apps/admin/api/translit.ts
 *
 * Requirements:
 *   pnpm add onnxruntime-node (in apps/admin)
 *
 * The model is loaded once and reused across invocations (module-level cache).
 * Vercel keeps the function warm between requests so cold starts are infrequent.
 */

import * as ort from 'onnxruntime-node'
import path from 'path'
import tokenizerData from '../assets/tokenizer.json'
import { suggest, expandNasalGeminate, type Tokenizer } from './beam'

// Resolve model path relative to this file at build time
const MODEL_PATH = path.resolve(__dirname, '../assets/model.onnx')

let session: ort.InferenceSession | null = null

async function getSession(): Promise<ort.InferenceSession> {
  if (session) return session
  session = await ort.InferenceSession.create(MODEL_PATH)
  return session
}

function makeTensor(data: Float32Array, dims: number[]) {
  return new ort.Tensor('float32', data, dims)
}

async function runSession(inputs: Record<string, any>) {
  const sess = await getSession()
  const feeds: Record<string, ort.Tensor> = {}
  for (const [key, val] of Object.entries(inputs)) {
    feeds[key] = new ort.Tensor('float32', val.data, val.dims)
  }
  return sess.run(feeds)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function transliterate(input: string): Promise<string[]> {
  return suggest(input, runSession, makeTensor, tokenizerData as Tokenizer)
}

export async function transliterateBest(input: string): Promise<string> {
  const results = await transliterate(input)
  return results[0] ?? ''
}

export { expandNasalGeminate }
