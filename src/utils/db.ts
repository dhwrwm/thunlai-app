/**
 * db.ts — SQLite database layer for Thunlai
 *
 * Data source: assets/data.json (bundled, from https://github.com/bihungorg/bihung)
 *   ~10K Bodo→English dictionary entries + ~21K English→Bodo subject glossaries
 *
 * Schema:
 *   words(id, bodo, roman, english, source, slug)
 *   favourites(word_id, added_at)
 *   history(word_id, viewed_at)
 *   meta(key, value)
 *
 * Full-text search via SQLite FTS5 virtual table.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'bihung.db';
const DATA_VERSION = '2';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const BUNDLED_DATA = require('../../assets/data.json') as { words: any[] };

export type Word = {
  id: number;
  bodo: string;
  roman: string;
  english: string;
  source: 'dictionary' | 'glossary';
  slug: string | null;
};

export type SearchResult = Word & { rank?: number };

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  return _db;
}

// ─── Schema setup ────────────────────────────────────────────────────────────

export async function initDb(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS words (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      bodo    TEXT NOT NULL,
      roman   TEXT NOT NULL DEFAULT '',
      english TEXT NOT NULL,
      source  TEXT NOT NULL DEFAULT 'dictionary',
      slug    TEXT
    );

    CREATE TABLE IF NOT EXISTS favourites (
      word_id  INTEGER PRIMARY KEY REFERENCES words(id) ON DELETE CASCADE,
      added_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS history (
      word_id   INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
      viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (word_id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
      bodo,
      roman,
      english,
      content = 'words',
      content_rowid = 'id',
      tokenize = 'unicode61'
    );
  `);
}

// ─── Seeding ─────────────────────────────────────────────────────────────────

/** Returns true when the DB already has data at the current version. */
export async function isSeeded(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'data_version'`
  );
  return row?.value === DATA_VERSION;
}

/**
 * Download data.json + data-roman.json from GitHub and populate the DB.
 * Runs in a single transaction for speed and atomicity.
 *
 * data.json schema (array of objects):
 *   { w: string, r?: string, e: string, s?: string }
 *   w = Bodo word (Devanagari), r = romanisation, e = English gloss, s = slug
 *
 * data-roman.json schema (array of objects):
 *   { e: string, w: string, r?: string }
 *   e = English term, w = Bodo translation, r = romanisation
 *
 * If the upstream schema differs the insertion is skipped for that entry but
 * the rest continues — robust against minor schema changes.
 */
export async function seedDatabase(
  onProgress?: (pct: number, msg: string) => void
): Promise<void> {
  const db = await getDb();

  onProgress?.(0, 'Loading dictionary…');

  // data.json is bundled with the app (assets/data.json)
  // Each entry: { id, word, b: string[], e: string[], s: string }
  //   s === 'dictionary'  → Bodo→English: word=bodo headword, e[0]=English gloss
  //   s !== 'dictionary'  → subject glossary (English→Bodo): word=English term, b[0]=Bodo translation
  const allEntries: any[] = BUNDLED_DATA.words ?? [];

  onProgress?.(30, `Loaded ${allEntries.length} entries…`);

  // Wipe existing words (clean re-seed)
  await db.execAsync(`DELETE FROM words; DELETE FROM words_fts;`);

  const dictEntries = allEntries.filter((e: any) => e?.s === 'dictionary');
  const glossEntries = allEntries.filter((e: any) => e?.s && e.s !== 'dictionary');
  const total = dictEntries.length + glossEntries.length;

  // Insert in batches of 500 for performance
  const BATCH = 500;
  let inserted = 0;

  // Dictionary entries (Bodo → English)
  for (let i = 0; i < dictEntries.length; i += BATCH) {
    const batch = dictEntries.slice(i, i + BATCH);
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const entry of batch) {
        const bodo = String(entry.word ?? '').trim();
        const english = String(entry.e?.[0] ?? '').trim();
        if (!bodo || !english) continue;
        await txn.runAsync(
          `INSERT INTO words (bodo, roman, english, source, slug) VALUES (?, '', ?, 'dictionary', ?)`,
          [bodo, english, String(entry.id ?? '')]
        );
      }
    });
    inserted += batch.length;
    onProgress?.(30 + Math.round((inserted / total) * 50), `Importing words… ${inserted}/${total}`);
  }

  // Glossary entries (English → Bodo, subject-specific)
  for (let i = 0; i < glossEntries.length; i += BATCH) {
    const batch = glossEntries.slice(i, i + BATCH);
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const entry of batch) {
        const english = String(entry.word ?? '').trim();
        const bodo = String(entry.b?.[0] ?? '').trim();
        if (!bodo || !english) continue;
        await txn.runAsync(
          `INSERT INTO words (bodo, roman, english, source, slug) VALUES (?, '', ?, 'glossary', NULL)`,
          [bodo, english]
        );
      }
    });
    inserted += batch.length;
    onProgress?.(30 + Math.round((inserted / total) * 50), `Importing glossary… ${inserted}/${total}`);
  }

  onProgress?.(82, 'Building search index…');

  // Populate FTS index
  await db.execAsync(`
    INSERT INTO words_fts (rowid, bodo, roman, english)
    SELECT id, bodo, roman, english FROM words;
  `);

  // Mark seeded
  await db.runAsync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES ('data_version', ?)`,
    [DATA_VERSION]
  );

  onProgress?.(100, 'Ready!');
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Full-text search across bodo, roman, and english columns. */
export async function searchWords(
  query: string,
  limit = 50,
  offset = 0
): Promise<SearchResult[]> {
  const db = await getDb();
  if (!query.trim()) return [];

  // FTS5 match — add * for prefix matching
  const ftsQuery = query.trim().replace(/['"*]/g, '') + '*';
  try {
    const rows = await db.getAllAsync<Word>(
      `SELECT w.id, w.bodo, w.roman, w.english, w.source, w.slug
       FROM words_fts f
       JOIN words w ON w.id = f.rowid
       WHERE words_fts MATCH ?
       ORDER BY rank
       LIMIT ? OFFSET ?`,
      [ftsQuery, limit, offset]
    );
    return rows;
  } catch {
    // Fallback: LIKE search if FTS fails
    const like = `%${query.trim()}%`;
    return db.getAllAsync<Word>(
      `SELECT id, bodo, roman, english, source, slug
       FROM words
       WHERE bodo LIKE ? OR roman LIKE ? OR english LIKE ?
       LIMIT ? OFFSET ?`,
      [like, like, like, limit, offset]
    );
  }
}

/** Alphabetical browse — all words starting with a Devanagari letter or letter range. */
export async function browseByLetter(
  letter: string,
  limit = 100,
  offset = 0
): Promise<Word[]> {
  const db = await getDb();
  return db.getAllAsync<Word>(
    `SELECT id, bodo, roman, english, source, slug
     FROM words
     WHERE bodo LIKE ? AND source = 'dictionary'
     ORDER BY bodo
     LIMIT ? OFFSET ?`,
    [`${letter}%`, limit, offset]
  );
}

export async function getWordById(id: number): Promise<Word | null> {
  const db = await getDb();
  return db.getFirstAsync<Word>(
    `SELECT id, bodo, roman, english, source, slug FROM words WHERE id = ?`,
    [id]
  );
}

export async function getRandomWords(count = 5): Promise<Word[]> {
  const db = await getDb();
  return db.getAllAsync<Word>(
    `SELECT id, bodo, roman, english, source, slug
     FROM words
     WHERE source = 'dictionary'
     ORDER BY RANDOM()
     LIMIT ?`,
    [count]
  );
}

export async function getWordOfTheDay(): Promise<Word | null> {
  const db = await getDb();
  // Deterministic by date — same word all day
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const total = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM words WHERE source = 'dictionary'`
  );
  if (!total?.cnt) return null;
  const offset = dayOfYear % total.cnt;
  return db.getFirstAsync<Word>(
    `SELECT id, bodo, roman, english, source, slug
     FROM words WHERE source = 'dictionary'
     LIMIT 1 OFFSET ?`,
    [offset]
  );
}

// ─── Favourites ───────────────────────────────────────────────────────────────

export async function getFavourites(): Promise<Word[]> {
  const db = await getDb();
  return db.getAllAsync<Word>(
    `SELECT w.id, w.bodo, w.roman, w.english, w.source, w.slug
     FROM favourites f JOIN words w ON w.id = f.word_id
     ORDER BY f.added_at DESC`
  );
}

export async function toggleFavourite(wordId: number): Promise<boolean> {
  const db = await getDb();
  const existing = await db.getFirstAsync(
    `SELECT word_id FROM favourites WHERE word_id = ?`,
    [wordId]
  );
  if (existing) {
    await db.runAsync(`DELETE FROM favourites WHERE word_id = ?`, [wordId]);
    return false;
  } else {
    await db.runAsync(
      `INSERT OR REPLACE INTO favourites (word_id, added_at) VALUES (?, datetime('now'))`,
      [wordId]
    );
    return true;
  }
}

export async function isFavourite(wordId: number): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT word_id FROM favourites WHERE word_id = ?`,
    [wordId]
  );
  return !!row;
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function recordView(wordId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO history (word_id, viewed_at) VALUES (?, datetime('now'))`,
    [wordId]
  );
}

export async function getHistory(limit = 20): Promise<Word[]> {
  const db = await getDb();
  return db.getAllAsync<Word>(
    `SELECT w.id, w.bodo, w.roman, w.english, w.source, w.slug
     FROM history h JOIN words w ON w.id = h.word_id
     ORDER BY h.viewed_at DESC
     LIMIT ?`,
    [limit]
  );
}

export async function clearHistory(): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM history`);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<{ total: number; dictionary: number; glossary: number; favourites: number }> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ total: number; dictionary: number; glossary: number }>(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN source='dictionary' THEN 1 ELSE 0 END) as dictionary,
            SUM(CASE WHEN source='glossary'   THEN 1 ELSE 0 END) as glossary
     FROM words`
  );
  const f = await db.getFirstAsync<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM favourites`);
  return {
    total: r?.total ?? 0,
    dictionary: r?.dictionary ?? 0,
    glossary: r?.glossary ?? 0,
    favourites: f?.cnt ?? 0,
  };
}
