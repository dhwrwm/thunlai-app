-- Words table in Postgres (mirrors the mobile SQLite schema)
-- Populated from data.json via the sync script: scripts/sync-words.ts
CREATE TABLE IF NOT EXISTS words (
  id      SERIAL PRIMARY KEY,
  bodo    TEXT NOT NULL,
  roman   TEXT NOT NULL DEFAULT '',
  english TEXT NOT NULL,
  source  TEXT NOT NULL DEFAULT 'dictionary' CHECK (source IN ('dictionary', 'glossary')),
  slug    TEXT
);

-- Full-text search vector (Bodo is Devanagari — use 'simple' config)
ALTER TABLE words ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(bodo, '') || ' ' || coalesce(roman, '') || ' ' || coalesce(english, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS words_fts_idx ON words USING GIN (fts);
CREATE INDEX IF NOT EXISTS words_bodo_idx ON words (bodo text_pattern_ops);
CREATE INDEX IF NOT EXISTS words_source_idx ON words (source);

-- Public read access
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read words" ON words FOR SELECT USING (true);
