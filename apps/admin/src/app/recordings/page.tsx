import { createClient } from '@/lib/supabase/server';
import RecordingCard from '@/components/RecordingCard';
import type { RecordingWithAudio } from '@thunlai/types';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ status?: string }> };

export default async function RecordingsPage({ searchParams }: Props) {
  const { status = 'pending' } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recordings')
    .select(`*, contributor:contributors(display_name, email)`)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  const recordings = (data ?? []) as RecordingWithAudio[];

  const tabs = ['pending', 'approved', 'rejected'];

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

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error.message}</div>
      )}

      {recordings.length === 0 ? (
        <p className="text-gray-500">No {status} recordings.</p>
      ) : (
        <div className="grid gap-4">
          {recordings.map((r) => (
            <RecordingCard key={r.id} recording={r} />
          ))}
        </div>
      )}
    </>
  );
}
