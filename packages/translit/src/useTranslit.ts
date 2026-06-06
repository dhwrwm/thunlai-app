/**
 * useTranslit — shared React hook for Roman → Devanagari transliteration
 *
 * Platform-agnostic: works identically in React Native and React web.
 * The underlying transliterate() function is resolved per-platform:
 *   React Native → translit.native.ts (onnxruntime-react-native)
 *   Web          → translit.web.ts    (onnxruntime-web)
 *
 * Usage (search screen):
 *   const { onChangeText, devanagari, suggestions, isLoading } = useTranslit()
 *   <TextInput onChangeText={onChangeText} />
 *   <Text>Searching as: {devanagari}</Text>
 *
 * Usage (submit word screen — high accuracy):
 *   const { onChangeText, suggestions } = useTranslit({ showSuggestions: true })
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { transliterate, transliterateBest, expandNasalGeminate } from './translit.native'
// Note: Metro resolves translit.native.ts on RN, Vite uses translit.web.ts on web
// This import works correctly on both platforms via bundler resolution

type UseTranslitOptions = {
  /** Debounce delay in ms (default: 200) */
  debounceMs?: number
  /** Return multiple beam candidates as suggestions (default: false) */
  showSuggestions?: boolean
  /** Called when Devanagari value changes */
  onDevanagari?: (value: string) => void
}

type UseTranslitResult = {
  /** Raw text as typed by user */
  rawInput: string
  /** Best Devanagari transliteration (or rawInput if already Devanagari / English) */
  devanagari: string
  /** All beam candidates — only populated when showSuggestions: true */
  suggestions: string[]
  /** True while the ONNX model is running */
  isLoading: boolean
  /** Pass directly to TextInput onChangeText */
  onChangeText: (text: string) => void
  /** Clear all state */
  clear: () => void
  /** The value to use for search / form submission */
  searchValue: string
}

export function useTranslit(options: UseTranslitOptions = {}): UseTranslitResult {
  const {
    debounceMs = 200,
    showSuggestions = false,
    onDevanagari,
  } = options

  const [rawInput, setRawInput]       = useState('')
  const [devanagari, setDevanagari]   = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading]     = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const latestRef = useRef<string>('') // tracks latest input to discard stale results

  const runTranslit = useCallback(async (text: string) => {
    latestRef.current = text

    if (!text.trim()) {
      setDevanagari('')
      setSuggestions([])
      onDevanagari?.('')
      return
    }

    // Already Devanagari — pass through
    if (/[\u0900-\u097F]/.test(text)) {
      setDevanagari(text)
      setSuggestions([])
      onDevanagari?.(text)
      return
    }

    // Purely English (no Bodo pattern) — don't convert, search English column
    // Heuristic: if contains only a-z and no Bodo-typical consonant pairs, skip
    // Let the search handle it via the English FTS5 column
    const looksLikeBodo = /[bdfghjklmnprstvwy]/i.test(text) &&
      !/^[a-z\s]+$/.test(text.replace(/[bdfghjklmnprstvwy]/gi, ''))
    // Actually always attempt transliteration — model handles English gracefully

    setIsLoading(true)

    try {
      if (showSuggestions) {
        const results = await transliterate(text)
        if (latestRef.current !== text) return // stale result

        const best = results[0] ?? ''
        setDevanagari(best)
        setSuggestions(results)
        onDevanagari?.(best)
      } else {
        const best = await transliterateBest(text)
        if (latestRef.current !== text) return // stale result

        setDevanagari(best)
        setSuggestions([])
        onDevanagari?.(best)
      }
    } catch {
      // Model error — use raw input
      if (latestRef.current === text) {
        setDevanagari(text)
        setSuggestions([])
        onDevanagari?.(text)
      }
    } finally {
      if (latestRef.current === text) {
        setIsLoading(false)
      }
    }
  }, [showSuggestions, onDevanagari])

  const onChangeText = useCallback((text: string) => {
    setRawInput(text)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runTranslit(text), debounceMs)
  }, [runTranslit, debounceMs])

  const clear = useCallback(() => {
    clearTimeout(timerRef.current)
    setRawInput('')
    setDevanagari('')
    setSuggestions([])
    setIsLoading(false)
    onDevanagari?.('')
  }, [onDevanagari])

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return {
    rawInput,
    devanagari,
    suggestions,
    isLoading,
    onChangeText,
    clear,
    searchValue: devanagari || rawInput,
  }
}
