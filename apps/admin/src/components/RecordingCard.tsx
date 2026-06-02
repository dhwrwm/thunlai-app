import Link from 'next/link';
import AudioPlayer from './AudioPlayer';
import type { RecordingWithAudio } from '@thunlai/types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function RecordingCard({ recording }: { recording: RecordingWithAudio }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xl font-bold text-gray-900">{recording.word_bodo}</p>
          {recording.word_roman && (
            <p className="text-xs italic text-primary-dark">/{recording.word_roman}/</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {recording.contributor?.display_name} · {recording.contributor?.email}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[recording.status] ?? ''}`}
        >
          {recording.status}
        </span>
      </div>

      <AudioPlayer url={recording.audio_url} />

      {recording.review_note && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 italic">
          {recording.review_note}
        </p>
      )}

      {recording.status === 'pending' && (
        <Link
          href={`/recordings/${recording.id}`}
          className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Review →
        </Link>
      )}
    </div>
  );
}
