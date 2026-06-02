export type WordSource = 'dictionary' | 'glossary';
export type RecordingStatus = 'pending' | 'approved' | 'rejected';

export type Word = {
  id: number;
  bodo: string;
  roman: string;
  english: string;
  source: WordSource;
  slug: string | null;
};

export type Recording = {
  id: string;
  word_id: number;
  word_bodo: string;
  word_roman: string;
  contributor_id: string;
  storage_path: string;
  duration_ms: number | null;
  status: RecordingStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

export type Contributor = {
  id: string;
  display_name: string;
  email: string;
  bio: string | null;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
};

export type RecordingWithAudio = Recording & {
  audio_url: string;
  contributor: Pick<Contributor, 'display_name' | 'email'>;
};
