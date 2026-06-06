'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AudioPlayer from '@/components/AudioPlayer';
import type { RecordingWithAudio } from '@thunlai/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [recording, setRecording] = useState<RecordingWithAudio | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/recordings/${id}`)
      .then((r) => r.json())
      .then(setRecording);
  }, [id]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    setLoading(true);
    await fetch(`/api/recordings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, review_note: note || null }),
    });
    router.push('/recordings');
  };

  if (!recording) {
    return <div className="py-20 text-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="max-w-2xl">
      <a href="/recordings" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
        ← Recordings
      </a>

      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <div className="mb-4">
          <p className="text-2xl font-bold text-gray-900">{recording.word_bodo}</p>
          {recording.word_roman && (
            <p className="text-sm italic text-primary-dark">/{recording.word_roman}/</p>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Contributor</p>
            <p className="font-medium">{recording.contributor?.display_name}</p>
            <p className="text-gray-500">{recording.contributor?.email}</p>
          </div>
          <div>
            <p className="text-gray-400">Duration</p>
            <p className="font-medium">
              {recording.duration_ms ? `${(recording.duration_ms / 1000).toFixed(1)}s` : '—'}
            </p>
          </div>
        </div>

        <AudioPlayer url={recording.audio_url} />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Review note (optional)…"
          rows={3}
          className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleAction('approved')}
            disabled={loading}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => handleAction('rejected')}
            disabled={loading}
            className="flex-1 rounded-xl border border-red-300 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            ✗ Reject
          </button>
        </div>
      </div>
    </div>
  );
}
