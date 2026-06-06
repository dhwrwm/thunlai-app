import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import RecordingCard from '@/components/RecordingCard';
import type { RecordingWithAudio, RecordingStatus } from '@thunlai/types';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

type Props = { searchParams: Promise<{ status?: string }> };

export default async function RecordingsPage({ searchParams }: Props) {
  const { status = 'pending' } = await searchParams;
  const tabs = ['pending', 'approved', 'rejected'] as const;

  const rows = await db
    .select({
      id: schema.recordings.id,
      word_id: schema.recordings.word_id,
      word_bodo: schema.recordings.word_bodo,
      word_roman: schema.recordings.word_roman,
      contributor_id: schema.recordings.contributor_id,
      storage_path: schema.recordings.storage_path,
      duration_ms: schema.recordings.duration_ms,
      status: schema.recordings.status,
      reviewed_by: schema.recordings.reviewed_by,
      reviewed_at: schema.recordings.reviewed_at,
      review_note: schema.recordings.review_note,
      created_at: schema.recordings.created_at,
      contributor: {
        display_name: schema.contributors.display_name,
        email: schema.contributors.email,
      },
    })
    .from(schema.recordings)
    .leftJoin(schema.contributors, eq(schema.recordings.contributor_id, schema.contributors.id))
    .where(eq(schema.recordings.status, status as RecordingStatus))
    .orderBy(desc(schema.recordings.created_at))
    .limit(50);

  const recordings: RecordingWithAudio[] = rows.map((r) => ({
    ...r,
    audio_url: `${SUPABASE_URL}/storage/v1/object/public/audio/${r.storage_path}`,
    contributor: r.contributor ?? { display_name: 'Unknown', email: '' },
  }));

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {tabs.map((t) => (
            <a
              key={t}
              href={`/recordings?status=${t}`}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                status === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </a>
          ))}
        </div>
      </div>

      {recordings.length === 0 ? (
        <p className="text-gray-500">No {status} recordings.</p>
      ) : (
        <div className="grid gap-4">
          {recordings.map((r) => <RecordingCard key={r.id} recording={r} />)}
        </div>
      )}
    </>
  );
}
