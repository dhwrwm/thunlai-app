/**
 * translit.native.ts — React Native implementation
 *
 * Uses onnxruntime-react-native which runs the ONNX model natively:
 *   iOS     → Core ML backend (fast, hardware accelerated)
 *   Android → NNAPI / CPU backend
 *
 * Metro bundler resolves .native.ts over .ts automatically, so:
 *   import { createTranslit } from '@thunlai/translit'
 * picks this file on iOS/Android and translit.web.ts on web.
 *
 * Requirements:
 *   pnpm add onnxruntime-react-native (in apps/app)
 *   Requires a dev build — does NOT work in Expo Go
 *
 * model.onnx is bundled as an Expo asset (via metro.config.js assetExts).
 */

import { InferenceSession, Tensor } from 'onnxruntime-react-native'
import { Asset } from 'expo-asset'
import tokenizerData from '../assets/tokenizer.json'
import { suggest, expandNasalGeminate, type Tokenizer } from './beam'

// model.onnx is resolved by Metro as a static asset
// metro.config.js must include 'onnx' in assetExts
const MODEL_REQUIRE = require('../assets/model.onnx')

let session: InferenceSession | null = null
let loading = false
let loadError: Error | null = null

async function getSession(): Promise<InferenceSession> {
  if (session) return session
  if (loading) {
    // Wait for existing load
    await new Promise<void>(resolve => {
      const check = setInterval(() => {
        if (!loading) { clearInterval(check); resolve() }
      }, 50)
    })
    if (session) return session
    throw loadError ?? new Error('Model failed to load')
  }

  loading = true
  try {
    const asset = await Asset.fromModule(MODEL_REQUIRE).downloadAsync()
    session = await InferenceSession.create(asset.localUri!)
    return session
  } catch (e) {
    loadError = e as Error
    throw e
  } finally {
    loading = false
  }
}

function makeTensor(data: Float32Array, dims: number[]) {
  return new Tensor('float32', data, dims)
}

async function runSession(inputs: Record<string, any>) {
  const sess = await getSession()
  const feeds: Record<string, Tensor> = {}
  for (const [key, val] of Object.entries(inputs)) {
    feeds[key] = new Tensor('float32', val.data, val.dims)
  }
  return sess.run(feeds)
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Pre-load the model so first search is instant. Call in app _layout.tsx. */
export async function warmup(): Promise<void> {
  try {
    await getSession()
  } catch (e) {
    console.warn('[translit] Model warmup failed:', e)
  }
}

/**
 * Transliterate a Roman Bodo word to Devanagari candidates.
 * Returns best candidate first (beam score order).
 *
 * @example
 *   await transliterate('goso')    // ['गोसो', ...]
 *   await transliterate("bor'")    // ["बर'", ...]
 *   await transliterate('thunlai') // ['थुनलाइ', ...]
 */
export async function transliterate(input: string): Promise<string[]> {
  try {
    return await suggest(input, runSession, makeTensor, tokenizerData as Tokenizer)
  } catch (e) {
    console.warn('[translit] Inference failed, using empty result:', e)
    return []
  }
}

/** Best single candidate, or empty string if none. */
export async function transliterateBest(input: string): Promise<string> {
  const results = await transliterate(input)
  return results[0] ?? ''
}

export { expandNasalGeminate }
