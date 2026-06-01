# Thunlai — Bodo ↔ English Dictionary

Offline-first Bodo ↔ English dictionary for iOS and Android, built with **Expo SDK 52** + **expo-sqlite**.
Dictionary data sourced from [github.com/bihungorg/bihung](https://github.com/bihungorg/bihung)
(CC BY-SA 4.0 — © Bodo Sahitya Sabha).

---

## Features

- **31,000+ words** — ~10K Bodo→English dictionary + ~21K English→Bodo glossary
- **Fully offline** after first launch — all data stored in on-device SQLite
- **Instant FTS5 search** — searches Bodo (Devanagari), romanisation, and English simultaneously
- **Browse A–Z** — tap any Devanagari letter to browse entries alphabetically
- **Word of the Day** — deterministic daily word, same for all users on a given date
- **Audio pronunciation** — approved contributor recordings streamed and cached locally
- **TTS fallback** — expo-speech with `hi-IN` locale when no recording exists
- **Favourites** — star words, persisted in SQLite
- **History** — recently viewed words, clearable
- **Contributor recording** — sign in and record pronunciations for any word
- **Dark mode** — respects system colour scheme

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 52 + Expo Router v4 |
| Language | TypeScript (strict) |
| Local database | expo-sqlite v14 (async API) + FTS5 |
| Audio playback | expo-av |
| Audio recording | expo-av (Recording API) |
| TTS fallback | expo-speech (`hi-IN` locale) |
| Backend / auth | Supabase (Postgres + Storage + Auth) |
| Session storage | expo-secure-store |
| List rendering | @shopify/flash-list |
| Build | EAS Build |

---

## Data sources

| File | Content | Count |
|------|---------|-------|
| `data.json` | Bodo→English dictionary | ~10K entries |
| `data-roman.json` | English→Bodo glossary | ~21K entries |

Both files are fetched from GitHub on first launch and stored locally. The app works
fully offline after that. To re-seed (e.g. after a data update), bump `DATA_VERSION`
in `src/utils/db.ts`.

**JSON schema:**

```jsonc
// data.json
{ "w": "बर'", "r": "bor", "e": "Bodo people/language", "s": "slug" }

// data-roman.json
{ "e": "rain", "w": "अखा", "r": "okha" }
```

Fields: `w`/`bodo` = Bodo word, `r`/`roman` = romanisation, `e`/`english` = gloss, `s` = URL slug.

---

## Project structure

```
thunlai-app/
├── app/
│   ├── _layout.tsx              # Root layout — DB init, seed, Supabase auth
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Bottom tab navigator (4 tabs)
│   │   ├── index.tsx            # Home: Word of Day, stats, alphabet browser, history
│   │   ├── search.tsx           # FTS5 search (Bodo / roman / English), filter pills
│   │   ├── favourites.tsx       # Starred words (SQLite-persisted)
│   │   └── settings.tsx         # About, attribution, clear history
│   ├── word/[id].tsx            # Word detail: headword, pronunciation, examples
│   ├── record/[id].tsx          # Contributor recording screen
│   ├── browse/[letter].tsx      # Browse all words starting with a Devanagari letter
│   ├── history.tsx              # Full viewing history
│   └── auth/sign-in.tsx         # Contributor sign-in / sign-up
├── src/
│   ├── utils/
│   │   ├── db.ts                # SQLite layer (init, seed, all queries)
│   │   ├── supabase.ts          # Supabase client + auth helpers + audio URL fetch
│   │   └── theme.ts             # Colors, spacing, radius, useTheme() hook
│   ├── components/
│   │   ├── WordCard.tsx         # Reusable word list card (speak + fav buttons)
│   │   └── SeedScreen.tsx       # First-launch progress screen
│   └── hooks/
│       ├── useSpeech.ts         # expo-speech wrapper (hi-IN TTS fallback)
│       ├── useAudio.ts          # expo-av playback + filesystem cache + Supabase fetch
│       ├── useRecorder.ts       # expo-av recording + Supabase Storage upload
│       ├── useExamples.ts       # Fetch + cache usage examples from bihung.org
│       └── useFavourites.ts     # Favourites state + toggle
├── supabase/
│   └── migrations/
│       └── 001_audio_recordings.sql
├── admin/
│   └── review-dashboard.html    # Standalone admin UI for approving recordings
├── assets/
├── babel.config.js              # Private-class-field transforms (Hermes fix)
├── metro.config.js              # transformIgnorePatterns for @supabase/* (Hermes fix)
├── app.json
└── package.json
```

---

## Getting started

### Prerequisites

- **Node 20+**
- **iOS**: Xcode 15+ with Simulator
- **Android**: Android Studio with emulator

> **Note:** expo-av, expo-sqlite v14, and expo-secure-store require a **development build** —
> they do not work in standard Expo Go. Use `eas build --profile development` or `npx expo run:ios`.

### Install & run

```bash
git clone <your-repo>
cd thunlai-app
npm install
```

Add your Supabase credentials to `app.json` before running:

```jsonc
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
      "supabaseAnonKey": "eyJ..."
    }
  }
}
```

```bash
# iOS development build (recommended)
npx expo run:ios

# Android development build
npx expo run:android

# Expo Go (limited — audio/recording/secure-store won't work)
npx expo start --clear
```

### First launch

On first launch the app downloads `data.json` + `data-roman.json` from GitHub (~3–5 MB total),
imports all entries into SQLite in batched transactions, builds an FTS5 search index, then
launches. This takes 10–30 seconds on a decent connection. After that everything is fully offline.

### Production build

```bash
npm install -g eas-cli
eas login
eas build:configure

eas build --platform android
eas build --platform ios
```

---

## Architecture

### Local database (`src/utils/db.ts`)

SQLite via expo-sqlite v14 (async API only). Tables:

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

### Supabase schema (remote)

```sql
contributors  (id, display_name, email, bio, approved, ...)
recordings    (id, word_id, contributor_id, storage_path, duration_ms, status, ...)
words_audio   VIEW — approved recordings with public CDN audio_url
```

`recordings.status` enum: `pending | approved | rejected`.
Storage bucket: `audio` (public, 5 MB limit, accepts audio/m4a, audio/mpeg, audio/wav).

### Audio pipeline

```
Contributor records M4A → uploads to Supabase Storage
    → inserts recordings row (status: pending)
    → admin approves via review-dashboard.html
    → status = approved

Mobile app (useAudio hook):
    1. Check audio_cache → play local file if valid
    2. Fetch audio_url from words_audio Supabase view
    3. Download M4A to FileSystem.documentDirectory/audio/word_<id>.m4a
    4. Cache path in audio_cache
    5. Play via expo-av
    6. Fallback: expo-speech hi-IN if no approved recording
```

### Search

`searchWords()` runs an FTS5 MATCH query with `*` suffix for prefix matching.
On parse error (e.g. special characters) it falls back to a LIKE query on all three columns.

### Offline strategy

1. On first launch, `isSeeded()` checks the `meta` table for `data_version`.
2. If not seeded, `seedDatabase()` fetches both JSON files and bulk-inserts in 500-row transactions.
3. After seeding, `data_version` is written — subsequent launches skip seeding entirely.
4. To force a re-seed, increment `DATA_VERSION` in `src/utils/db.ts`.

---

## Known issues & constraints

- **Hermes + private class fields**: `@supabase/supabase-js` uses `#privateField` syntax, which Hermes doesn't support natively. Fixed via `babel.config.js` transforms and `metro.config.js` `transformIgnorePatterns`. Do not remove these.
- **Bodo TTS**: ISO 639-3 code is `brx`. No native TTS voice exists on iOS/Android. `hi-IN` (Hindi) is used as the closest Devanagari-script approximation.
- **Devanagari rendering on Android**: `lineHeight` must be at least `1.4 × fontSize` to avoid clipping.
- **Development build required**: expo-av, expo-sqlite v14, and expo-secure-store do not work in standard Expo Go.

---

## License

- **App code**: MIT
- **Dictionary data**: CC BY-SA 4.0 — © Bodo Sahitya Sabha / bihung.org

Please attribute and link back to https://bihung.org when redistributing.
