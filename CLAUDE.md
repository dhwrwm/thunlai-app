# Thunlai — Claude Code Assistant

You are an expert React Native / Expo developer working on the **Thunlai** app — an open-source offline-first Bodo ↔ English dictionary for iOS and Android.

---

## Project identity

- **App name**: Thunlai
- **Bundle ID**: `org.thunlai.app`
- **Repo**: https://github.com/bihungorg/bihung (data source)
- **Live site**: https://bihung.org
- **Data license**: CC BY-SA 4.0 — © Bodo Sahitya Sabha
- **Code license**: MIT

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 52 + Expo Router v4 (file-based routing) |
| Language | TypeScript (strict) |
| Local database | expo-sqlite v14 (async API) + FTS5 full-text search |
| Audio playback | expo-av |
| Audio recording | expo-av (Recording API) |
| TTS fallback | expo-speech (hi-IN locale — closest to Bodo BRX) |
| Backend / auth | Supabase (Postgres + Storage + Auth) |
| Session storage | expo-secure-store |
| List rendering | @shopify/flash-list |
| Navigation | Expo Router (tabs + stack) |
| Build | EAS Build |

---

## Repository layout

```
bihung-app/
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
│       └── 001_audio_recordings.sql  # Full Supabase schema
├── admin/
│   └── review-dashboard.html    # Standalone admin UI for approving recordings
├── assets/                      # All app icons, splash, screenshots
├── babel.config.js              # Includes private-class-field transforms (Hermes fix)
├── metro.config.js              # transformIgnorePatterns for @supabase/* (Hermes fix)
├── app.json                     # Expo config (add supabaseUrl + supabaseAnonKey in extra)
└── package.json
```

---

## Database schema (SQLite — on-device)

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

`source` is either `'dictionary'` (Bodo→English, ~10K entries) or `'glossary'` (English→Bodo, ~21K entries).

---

## Supabase schema (remote)

```sql
contributors  (id, display_name, email, bio, approved, approved_at, approved_by, created_at)
recordings    (id, word_id, word_bodo, word_roman, contributor_id, storage_path,
               duration_ms, status, reviewed_by, reviewed_at, review_note, created_at)
words_audio   VIEW — approved recordings with public CDN audio_url
```

`recordings.status` is an enum: `pending | approved | rejected`.
Storage bucket: `audio` (public, 5MB limit, accepts audio/m4a, audio/mpeg, audio/wav).

---

## Data source

The dictionary data is fetched from GitHub on first launch:
- `https://raw.githubusercontent.com/bihungorg/bihung/main/data.json` — Bodo→English entries
- `https://raw.githubusercontent.com/bihungorg/bihung/main/data-roman.json` — English→Bodo glossary

JSON schema: `{ w: string, r?: string, e: string, s?: string }` (also accepts `bodo/roman/english` keys).
Seeded in 500-row SQLite transactions. Re-seed is triggered by bumping `DATA_VERSION` in `db.ts`.

---

## Audio pipeline

```
Approved contributor → records M4A via useRecorder
    → uploads to Supabase Storage (audio/recordings/word_<id>_...)
    → inserts recordings row (status: pending)
    → admin approves in review-dashboard.html
    → status = approved

Mobile app (useAudio hook):
    1. Check audio_cache table → play local file if valid
    2. Fetch audio_url from words_audio Supabase view
    3. Download M4A to FileSystem.documentDirectory/audio/word_<id>.m4a
    4. Cache path in audio_cache table
    5. Play via expo-av
    6. Fallback: expo-speech hi-IN if no approved recording
```

---

## Theme system

All UI uses `useTheme()` from `src/utils/theme.ts`. Never hardcode colors.

```typescript
const { theme, isDark } = useTheme();
// theme.bg, theme.card, theme.text, theme.textSecondary, theme.border, etc.

// Brand constants (always the same in light + dark):
COLORS.primary       // #1D9E75
COLORS.primaryDark   // #0F6E56
COLORS.primaryLight  // #E1F5EE (green tint for backgrounds)
SPACING.sm / md / lg / xl / xxl
RADIUS.sm / md / lg / full
```

---

## Key conventions

- **All DB calls are async** — use `await`, never sync SQLite APIs.
- **FTS5 queries** append `*` for prefix matching. Wrap in try/catch and fall back to LIKE on parse error.
- **Expo Router navigation**: `router.push({ pathname: '/word/[id]', params: { id: word.id } })`
- **No hardcoded strings** for Supabase config — always read from `Constants.expoConfig.extra`.
- **Audio files** are stored at `FileSystem.documentDirectory + 'audio/word_<id>.m4a'`.
- **Devanagari rendering**: lineHeight must be at least 1.4× fontSize to avoid clipping on Android.
- **Dark mode**: always use `theme.*` tokens, never `useColorScheme()` directly in components.
- **Word cards**: always show speak (🔊) + favourite (☆/★) buttons. Never omit them.
- **All screens** must handle empty/loading/error states — never show a blank screen.

---

## Known issues & constraints

- **Hermes (Expo Go) + private class fields**: `@supabase/supabase-js` uses `#privateField` syntax. Fixed via `babel.config.js` transforms + `metro.config.js` `transformIgnorePatterns`. Do not remove these.
- **expo-av, expo-sqlite v14, expo-secure-store** require a development build — they do not work in standard Expo Go. Use `eas build --profile development` or `npx expo run:ios`.
- **Bodo TTS**: ISO 639-3 code is `brx`. No native TTS voice exists on iOS/Android. We use `hi-IN` (Hindi) as the closest Devanagari-script approximation.
- **expo-sqlite v14** uses a fully async API (`openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`). Do NOT use the old synchronous v13 API.
- **DATA_VERSION** in `db.ts` must be bumped to trigger a re-seed on next app launch after upstream data changes.

---

## Environment setup

```bash
# Install dependencies
npm install

# Add to app.json > extra before running:
{
  "extra": {
    "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
    "supabaseAnonKey": "eyJ..."
  }
}

# Run (development build recommended)
npx expo run:ios
npx expo run:android

# Or Expo Go (limited — audio/recording/secure-store won't work):
npx expo start --clear

# Production build
eas build --platform android
eas build --platform ios
```

---

## Your role

- Write production-quality TypeScript. No `any` unless truly unavoidable.
- Follow existing file/folder conventions exactly.
- Always handle loading, empty, and error states in UI.
- Preserve the offline-first architecture — SQLite is the source of truth; network calls are always optional enhancements.
- When adding new screens, register them in `app/_layout.tsx`.
- When adding new DB columns, add a safe `ALTER TABLE ... ADD COLUMN` migration in `initDb()`.
- Respect the CC BY-SA 4.0 license — always attribute © Bodo Sahitya Sabha / bihung.org in any user-facing attribution text.
