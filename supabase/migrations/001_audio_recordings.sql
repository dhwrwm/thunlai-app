-- Contributors who can record pronunciations
CREATE TABLE IF NOT EXISTS contributors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  bio          TEXT,
  approved     BOOLEAN NOT NULL DEFAULT false,
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recording status enum
CREATE TYPE recording_status AS ENUM ('pending', 'approved', 'rejected');

-- Audio recordings submitted by contributors
CREATE TABLE IF NOT EXISTS recordings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id         INTEGER NOT NULL,
  word_bodo       TEXT NOT NULL,
  word_roman      TEXT NOT NULL DEFAULT '',
  contributor_id  UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  duration_ms     INTEGER,
  status          recording_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- View: approved recordings with public CDN audio URL
CREATE OR REPLACE VIEW words_audio AS
SELECT
  r.id,
  r.word_id,
  r.word_bodo,
  r.word_roman,
  r.duration_ms,
  r.created_at,
  concat(
    current_setting('app.supabase_url', true),
    '/storage/v1/object/public/audio/',
    r.storage_path
  ) AS audio_url
FROM recordings r
WHERE r.status = 'approved';

-- RLS
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read contributors" ON contributors FOR SELECT USING (true);
CREATE POLICY "Public read approved recordings" ON recordings FOR SELECT USING (status = 'approved');
CREATE POLICY "Contributors insert own recordings" ON recordings FOR INSERT
  WITH CHECK (auth.uid() = contributor_id);
