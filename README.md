# Thunlai — Bodo ↔ English Dictionary

Open-source Bodo ↔ English dictionary platform with a mobile app, public web app, and admin dashboard.  
Dictionary data sourced from [github.com/bihungorg/bihung](https://github.com/bihungorg/bihung) (CC BY-SA 4.0 — © Bodo Sahitya Sabha).

---

## Apps

| App | Path | URL |
|---|---|---|
| Mobile (iOS + Android) | `apps/mobile/` | — |
| Public web | `apps/web/` | https://bihung.org |
| Admin dashboard | `apps/admin/` | — |

---

## Features

- **31,000+ words** — ~10K Bodo→English dictionary + ~21K English→Bodo glossary
- **Offline-first mobile app** — SQLite on-device after first sync
- **Instant search** — FTS5 (mobile) and Postgres full-text (web) across Bodo, romanisation, and English
- **Transliteration** — Roman → Devanagari via on-device ONNX seq2seq model (`@thunlai/translit`)
- **Browse A–Z** — tap any Devanagari letter to list entries alphabetically
- **Word of the Day** — deterministic daily word
- **Audio pronunciation** — contributor recordings streamed and cached locally
- **TTS fallback** — `expo-speech` with `hi-IN` locale when no recording exists
- **Favourites & history** — persisted in SQLite (mobile)
- **Contributor recording** — sign in and record pronunciations for any word
- **Admin review** — approve / reject pending recordings in the dashboard
- **Dark mode** — respects system colour scheme

---

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Mobile | Expo SDK 54 + Expo Router v6 |
| Web / Admin | Next.js 15 App Router + Tailwind CSS v3 |
| Language | TypeScript (strict) everywhere |
| Mobile DB | expo-sqlite v14 (async) + FTS5 full-text search |
| Remote DB | Neon (Postgres) via `@neondatabase/serverless` |
| ORM | Drizzle ORM + drizzle-kit |
| Auth + Storage | Supabase Auth + Supabase Storage (audio bucket) |
| Transliteration | ONNX seq2seq (Core ML / NNAPI / WASM) — `@thunlai/translit` |
| Audio playback | expo-av (mobile) |
| TTS fallback | expo-speech `hi-IN` (mobile) |
| List rendering | @shopify/flash-list (mobile) |
| Build | EAS Build |

---

## Monorepo structure

```
thunlai-app/
├── apps/
│   ├── mobile/                  # @thunlai/mobile — Expo SDK 54
│   │   ├── app/
│   │   │   ├── _layout.tsx      # Root layout — DB init, seed, auth
│   │   │   ├── (tabs)/          # Home, Search, Favourites, Settings, Learn
│   │   │   ├── word/[id].tsx    # Word detail + similar words
│   │   │   └── browse/[letter].tsx
│   │   └── src/
│   │       ├── utils/db.ts      # SQLite layer (init, seed, all queries)
│   │       └── components/      # WordCard, SeedScreen
│   ├── web/                     # @thunlai/web — Next.js 15 (port 3000)
│   │   └── src/app/
│   │       ├── page.tsx         # Homepage: search + word of day + alphabet
│   │       ├── word/[id]/       # Word detail page (SSR)
│   │       ├── browse/[letter]/ # Browse by Devanagari letter (SSR)
│   │       └── api/search/      # Search API route (Drizzle + Neon)
│   └── admin/                   # @thunlai/admin — Next.js 15 (port 3001)
│       └── src/app/
│           ├── page.tsx         # Stats dashboard
│           ├── recordings/      # List + review individual recordings
│           ├── contributors/    # Contributors table
│           └── login/           # Supabase auth sign-in
├── packages/
│   ├── db/                      # @thunlai/db — Drizzle schema + Neon client
│   │   ├── src/schema.ts        # words, contributors, recordings tables
│   │   ├── src/index.ts         # exports db, schema
│   │   ├── scripts/seed-neon.ts # seed script (pnpm db:seed)
│   │   └── drizzle.config.ts
│   ├── translit/                # @thunlai/translit — Roman→Devanagari ONNX model
│   │   ├── assets/model.onnx    # 2.4 MB seq2seq transformer
│   │   ├── assets/tokenizer.json
│   │   └── src/
│   │       ├── beam.ts          # runtime-agnostic beam search
│   │       ├── translit.native.ts  # onnxruntime-react-native
│   │       ├── translit.web.ts     # onnxruntime-web (WASM)
│   │       ├── translit.server.ts  # onnxruntime-node (Vercel/Edge)
│   │       └── useTranslit.ts   # React hook (RN + web)
│   ├── types/src/index.ts       # Shared TypeScript types (Word, Recording, …)
│   └── config/                  # Shared tsconfig + eslint bases
├── supabase/
│   ├── migrations/
│   │   ├── 001_audio_recordings.sql
│   │   └── 002_words_table.sql
│   └── functions/
│       ├── search/index.ts      # Deno edge function: FTS search
│       └── word/index.ts        # Deno edge function: word + audio by ID
├── .env.example                 # Shared env template (copy to .env)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Getting started

### Prerequisites

- **Node 22+** and **pnpm 10+**
- **iOS**: Xcode 15+ with Simulator
- **Android**: Android Studio with emulator

> `expo-av`, `expo-sqlite v14`, and `expo-secure-store` require a **development build** —
> they do not work in standard Expo Go. Use `eas build --profile development` or `npx expo run:ios`.

### Install

```bash
git clone <your-repo>
cd thunlai-app
pnpm install
```

### Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

```env
# Neon — shared across all apps and scripts
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require

# Supabase — auth + audio storage (web + admin)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

The root `.env` is loaded by:
- `pnpm db:seed` — via Node `--env-file=.env`
- Turborepo tasks (`dev`, `build`) — injected via `globalEnv`
- Next.js apps — read from `process.env` at runtime

### Dev servers

```bash
pnpm dev          # all apps in parallel
pnpm dev:web      # web only  (port 3000)
pnpm dev:admin    # admin only (port 3001)
pnpm dev:mobile   # Expo start
```

### Mobile (development build)

```bash
cd apps/mobile
npx expo run:ios      # iOS simulator
npx expo run:android  # Android emulator
```

### Database

```bash
# Push schema to Neon
pnpm --filter=@thunlai/db db:push

# Seed 31K words from bihung.org
pnpm db:seed

# Open Drizzle Studio
pnpm --filter=@thunlai/db db:studio
```

### Production build (mobile)

```bash
npm install -g eas-cli && eas login
eas build --platform android
eas build --platform ios
```

---

## Technical specs

### Mobile database (expo-sqlite v14)

On-device SQLite with FTS5 full-text search. All queries are async.

```sql
words       (id, bodo, roman, english, source, slug, examples)
favourites  (word_id, added_at)
history     (word_id, viewed_at)
meta        (key, value)          -- stores data_version
audio_cache (word_id, local_path, cached_at, valid)

words_fts   VIRTUAL TABLE USING fts5(
              bodo, roman, english,
              content='words', tokenize='unicode61'
            )
```

Search appends `*` for prefix matching and falls back to `LIKE` on FTS parse errors.

### Remote database — Neon (Postgres + Drizzle)

Shared across web and admin apps via `@thunlai/db`.

```
words         (id serial PK, bodo, roman, english, source, slug, fts tsvector)
contributors  (id uuid PK, display_name, email unique, bio, approved, approved_at,
               approved_by, created_at)
recordings    (id uuid PK, word_id, word_bodo, word_roman, contributor_id → contributors,
               storage_path, duration_ms, status recording_status, reviewed_by,
               reviewed_at, review_note, created_at)
```

`recording_status` enum: `pending | approved | rejected`.  
The `fts` column is a `tsvector` maintained by a Postgres trigger for full-text search on the web.

### Transliteration (`@thunlai/translit`)

Roman → Devanagari using a 2.4 MB ONNX seq2seq transformer from [bihung.org](https://bihung.org).

- **Tokenizer**: 36 input chars (Roman + diacritics), 69 output chars (Devanagari)
- **Inference**: beam search (width 4) — runtime-agnostic implementation in `beam.ts`
- **Platform resolution**:
  - React Native → `translit.native.ts` (onnxruntime-react-native, Core ML / NNAPI)
  - Web → `translit.web.ts` (onnxruntime-web, WebAssembly)
  - Server/Edge → `translit.server.ts` (onnxruntime-node)

```typescript
import { useTranslit, transliterate } from '@thunlai/translit';
// Same import on RN, web, and server — platform resolved automatically
```

### Audio pipeline

```
Contributor → records M4A → uploads to Supabase Storage
    → inserts recordings row (status: pending)
    → admin approves in dashboard → status = approved

Mobile playback (useAudio hook):
    1. Check audio_cache table → play local file if valid
    2. Fetch audio_url from Supabase words_audio view
    3. Download M4A to FileSystem.documentDirectory/audio/word_<id>.m4a
    4. Cache path in audio_cache
    5. Play via expo-av
    6. Fallback: expo-speech hi-IN
```

Supabase Storage bucket: `audio` (public, 5 MB limit, audio/m4a + audio/mpeg + audio/wav).

### Offline-first strategy (mobile)

1. On launch, `isSeeded()` checks `meta.data_version` in SQLite.
2. If unseeded, `seedDatabase()` fetches `data.json` from GitHub and bulk-inserts in 500-row transactions.
3. After seeding, `data_version` is written — subsequent launches skip seeding entirely.
4. To force a re-seed after upstream data changes, bump `DATA_VERSION` in `apps/mobile/src/utils/db.ts`.

### Data source

```
GET https://raw.githubusercontent.com/bihungorg/bihung/main/data.json
```

```jsonc
{
  "words": [
    // s = "dictionary" → Bodo→English: word is Devanagari, e[] are English meanings
    { "id": "1", "word": "अ", "b": ["..."], "e": ["the first vowel letter of the Bodo alphabet"], "s": "dictionary" },
    // other s values → glossary: word is English term, b[] are Bodo translations
    { "id": "10202", "word": "'A' Group culture", "b": ["'क' थाखो हारिमु"], "e": [], "s": "archeology" }
  ]
}
```

Seed mapping: `dictionary` entries → `bodo = word`, `english = e.join("; ")`; glossary entries → `bodo = b[0]`, `english = word`.

---

## Known issues & constraints

- **Hermes + private class fields**: `@supabase/supabase-js` uses `#privateField` syntax. Fixed via `babel.config.js` transforms and `metro.config.js` `transformIgnorePatterns`. Do not remove these.
- **Bodo TTS**: ISO 639-3 code is `brx`. No native TTS voice on iOS/Android. `hi-IN` (Hindi) is used as the closest Devanagari-script approximation.
- **Devanagari on Android**: `lineHeight` must be ≥ `1.4 × fontSize` to avoid clipping.
- **Development build required**: `expo-av`, `expo-sqlite v14`, and `expo-secure-store` do not work in standard Expo Go.
- **Node 22+** required for `db:seed` (`--experimental-strip-types` + `--env-file` flags).

---

## License

- **App code**: MIT
- **Dictionary data**: CC BY-SA 4.0 — © Bodo Sahitya Sabha / bihung.org
- **Transliteration model**: Apache 2.0 — bihung.org

Please attribute and link back to https://bihung.org when redistributing the dictionary data.
