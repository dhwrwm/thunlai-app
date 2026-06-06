/**
 * apps/admin/api/translit.ts — Vercel API route for transliteration
 *
 * Used by the admin panel (word submission form preview)
 * and as a fallback for the mobile app when online.
 *
 * POST /api/translit
 * Body: { word: string, k?: number }
 * Returns: { results: string[], best: string }
 *
 * The mobile app calls this when the ONNX model isn't loaded yet,
 * then uses its local onnxruntime-react-native for subsequent calls.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { transliterate } from '@thunlai/translit/src/translit.server'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { word, k = 3 } = req.body ?? {}

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'word is required' })
  }

  if (word.length > 50) {
    return res.status(400).json({ error: 'word too long' })
  }

  // Already Devanagari — return as-is
  if (/[\u0900-\u097F]/.test(word)) {
    return res.json({ results: [word], best: word })
  }

  try {
    const results = await transliterate(word)
    return res.json({
      results,
      best: results[0] ?? '',
    })
  } catch (err) {
    console.error('[/api/translit] error:', err)
    return res.status(500).json({ error: 'Transliteration failed', results: [], best: '' })
  }
}
