# बिहुं · Bihung Dictionary — React Native App

Offline-first Bodo ↔ English dictionary mobile app built with **Expo** + **expo-sqlite**.
Data sourced directly from [github.com/bihungorg/bihung](https://github.com/bihungorg/bihung)
(CC BY-SA 4.0 — © Bodo Sahitya Sabha).

---

## Features

- **31,000+ words** — ~10K Bodo→English dictionary + ~21K English→Bodo glossary
- **Fully offline** after first launch — all data stored in on-device SQLite
- **Instant FTS5 search** — searches Bodo (Devanagari), romanisation, and English simultaneously
- **Browse A–Z** — tap any Devanagari letter to browse entries alphabetically
- **Word of the Day** — deterministic daily word, same for all users on a given date
- **Favourites** — star words, persisted in SQLite
- **History** — recently viewed words, clearable
- **Dark mode** — respects system colour scheme
- **Share** — share any word as text

---

## Data Sources

| File | Content | Count |
|------|---------|-------|
| `data.json` | Bodo→English dictionary | ~10K entries |
| `data-roman.json` | English→Bodo glossary | ~21K entries |

Both files are fetched from GitHub on first launch and stored locally. The app works
fully offline after that. To re-seed (e.g. after a data update), bump `DATA_VERSION`
in `src/utils/db.ts`.

**JSON schema used:**

```jsonc
// data.json entries
{ "w": "बर'",  "r": "bor",   "e": "Bodo people/language", "s": "slug-for-url" }

// data-roman.json entries  
{ "e": "rain", "w": "अखा", "r": "okha" }
```

Fields: `w`/`bodo` = Bodo word, `r`/`roman` = romanisation, `e`/`english` = gloss, `s` = URL slug.

---

## Project structure

```
bihung-app/
├── app/
│   ├── _layout.tsx           # Root layout — DB init + seed
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Bottom tab navigator
│   │   ├── index.tsx         # Home: WOTD, stats, alphabet, history
│   │   ├── search.tsx        # Search with FTS5
│   │   ├── favourites.tsx    # Saved words
│   │   └── settings.tsx      # About + clear history
│   ├── word/[id].tsx         # Word detail screen
│   ├── browse/[letter].tsx   # Browse by Devanagari letter
│   └── history.tsx           # Full history list
├── src/
│   ├── utils/
│   │   ├── db.ts             # SQLite layer (init, seed, queries)
│   │   └── theme.ts          # Colors, spacing, dark-mode hook
│   ├── components/
│   │   ├── WordCard.tsx      # Reusable word list card
│   │   └── SeedScreen.tsx    # First-launch progress screen
│   └── hooks/
│       └── useFavourites.ts  # Favourites state + toggle
├── app.json
├── package.json
└── tsconfig.json
```

---

## Getting started

### Prerequisites

- **Node 20+**
- **Expo CLI**: `npm install -g expo-cli`
- **iOS**: Xcode 15+ with Simulator, OR Expo Go app
- **Android**: Android Studio with emulator, OR Expo Go app

### Install & run

```bash
git clone <your-repo>
cd bihung-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android/iOS), or press `i` for iOS simulator / `a` for Android emulator.

### First launch

On first launch the app downloads `data.json` + `data-roman.json` from GitHub (~3–5 MB total),
imports all entries into SQLite in batches, builds an FTS5 search index, then launches.
This takes 10–30 seconds on a decent connection. After that everything is fully offline.

### Build for production

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure (first time)
eas build:configure

# Build APK for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios
```

---

## Architecture

### Database (`src/utils/db.ts`)

SQLite via `expo-sqlite` v14 (async API). Tables:

```sql
words       (id, bodo, roman, english, source, slug)
favourites  (word_id, added_at)
history     (word_id, viewed_at)
meta        (key, value)

words_fts   VIRTUAL TABLE USING fts5(bodo, roman, english, content='words')
```

FTS5 with `unicode61` tokenizer handles Devanagari script correctly.
Prefix search: query terms get `*` appended so "अख" matches "अखार", "अखन्दा", etc.

### Offline strategy

1. On first launch, `isSeeded()` checks the `meta` table for `data_version`.
2. If not seeded, `seedDatabase()` fetches both JSON files and bulk-inserts in 500-row transactions.
3. After seeding, `data_version` is written — subsequent launches skip seeding entirely.
4. To force a re-seed (e.g. after upstream data updates), increment `DATA_VERSION` in `db.ts`.

### Search

`searchWords()` runs an FTS5 MATCH query. On parse error (e.g. special characters), it
falls back to a LIKE query on all three columns. Results are ordered by FTS5 rank (relevance).

---

## Customisation

### Add Devanagari font

The app uses the system font by default. For better Devanagari rendering:

```bash
npx expo install @expo-google-fonts/noto-sans-devanagari
```

Then in `app/_layout.tsx`:
```typescript
import { useFonts, NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari';
const [fontsLoaded] = useFonts({ NotoSansDevanagari_400Regular });
```

### Add audio pronunciation

```bash
npx expo install expo-speech
```

In `WordCard.tsx`:
```typescript
import * as Speech from 'expo-speech';
Speech.speak(word.bodo, { language: 'hi-IN' }); // closest available to Bodo
```

### Re-seed from updated data

1. Bump `DATA_VERSION` constant in `src/utils/db.ts`
2. Rebuild and release — users will re-download and re-index on next launch

---

## License

- **App code**: MIT
- **Dictionary data**: CC BY-SA 4.0 — © Bodo Sahitya Sabha / bihung.org

Please link back to https://bihung.org when redistributing.
