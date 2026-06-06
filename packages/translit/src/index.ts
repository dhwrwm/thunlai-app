/**
 * @thunlai/translit
 *
 * Bodo Roman → Devanagari transliteration.
 * ONNX seq2seq model from bihung.org (Apache 2.0).
 *
 * Platform resolution (automatic via bundler):
 *   React Native (Metro)  → translit.native.ts  (onnxruntime-react-native)
 *   Web/Vite (admin)      → translit.web.ts      (onnxruntime-web)
 *   Server (Vercel/Node)  → translit.server.ts   (onnxruntime-node)
 *
 * Shared across all platforms:
 *   beam.ts       — runtime-agnostic beam search logic
 *   useTranslit   — React hook (identical on RN + web)
 *   search.js     — expandNasalGeminate, translitSearch (from bihung.org)
 */

// Core functions (platform-specific, resolved by bundler)
export { transliterate, transliterateBest, warmup } from './translit.native'
// ^ Metro resolves .native.ts on RN; Vite uses .web.ts on web

// Shared React hook
export { useTranslit } from './useTranslit'
export type { } from './useTranslit'

// Pre-processing utilities (pure JS, shared everywhere)
export { expandNasalGeminate } from './beam'

// Full search utilities from bihung.org (for advanced usage)
// export { runSearch, translitSearch } from './search.js'
// (Uncomment if needed — requires Sanscript.js peer dep)
