# @thunlai/translit

Bodo Roman → Devanagari transliteration package.

ONNX seq2seq model + tokenizer from [bihung.org](https://bihung.org) (Apache 2.0 / bihungorg).

---

## Architecture

```
packages/translit/
├── assets/
│   ├── model.onnx        ← 2.4MB seq2seq transformer (from bihung.org)
│   └── tokenizer.json    ← 36 input chars, 69 Devanagari output chars
├── src/
│   ├── beam.ts           ← runtime-agnostic beam search (shared)
│   ├── translit.native.ts ← React Native (onnxruntime-react-native)
│   ├── translit.web.ts   ← Web/Vite    (onnxruntime-web)
│   ├── translit.server.ts ← Vercel      (onnxruntime-node)
│   ├── useTranslit.ts    ← React hook  (shared RN + web)
│   ├── search.js         ← bihung.org search utils (expandNasalGeminate etc.)
│   └── index.ts
```

## How platform resolution works

Metro (React Native) resolves `.native.ts` over `.ts` automatically.
Vite (web) resolves `.web.ts` if configured (or falls back to `.ts`).

```typescript
// Same import everywhere:
import { useTranslit, transliterate } from '@thunlai/translit'

// RN → onnxruntime-react-native (Core ML / NNAPI)
// Web → onnxruntime-web (WebAssembly via CDN)
// Server → onnxruntime-node (native binaries)
```

---

## Usage

### In React Native (apps/app)

```bash
pnpm add onnxruntime-react-native --filter app
pnpm add expo-asset --filter app
```

Add to `apps/app/metro.config.js`:
```js
config.resolver.assetExts.push('onnx')
```

Add to `apps/app/app.json`:
```json
{
  "expo": {
    "plugins": ["onnxruntime-react-native"]
  }
}
```

Warm up on app start (`app/_layout.tsx`):
```typescript
import { warmup } from '@thunlai/translit'
useEffect(() => { warmup() }, [])
```

Use in search screen:
```typescript
import { useTranslit } from '@thunlai/translit'

const { onChangeText, devanagari, isLoading } = useTranslit()

<TextInput onChangeText={onChangeText} />
{devanagari && <Text>Searching as: {devanagari}</Text>}
```

Use in submit word screen (with suggestions):
```typescript
const { onChangeText, suggestions, devanagari } = useTranslit({
  showSuggestions: true,
})

// Show chips: suggestions.map(s => <Chip key={s}>{s}</Chip>)
```

### In admin panel (apps/admin)

```bash
pnpm add onnxruntime-web --filter admin
```

Same `useTranslit` hook, same API. Vite picks `translit.web.ts` automatically.

### In Vercel API route (apps/admin/api/translit.ts)

```bash
pnpm add onnxruntime-node --filter admin
```

```typescript
import { transliterate } from '@thunlai/translit/src/translit.server'

const results = await transliterate('goso') // ['गोसो', ...]
```

---

## Model details

- Architecture: seq2seq Transformer (encoder-decoder)
- Input: Roman text, character-level, max 25 chars
- Output: Devanagari text, character-level, max 24 chars
- Vocab: 36 input tokens, 69 target tokens
- Size: 2.4MB
- Beam width: K=3 (returns up to 3 candidates)
- Pre-processing: expandNasalGeminate() — doubles consonant after n/m before vowel

## Attribution

Model and tokenizer: © bihungorg / bihung.org  
License: Apache 2.0  
Source: https://github.com/bihungorg/bihung
