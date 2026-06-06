import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { RecordingWithAudio, RecordingStatus } from '@thunlai/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [row] = await db
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
    .where(eq(schema.recordings.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const recording: RecordingWithAudio = {
    ...row,
    audio_url: `${SUPABASE_URL}/storage/v1/object/public/audio/${row.storage_path}`,
    contributor: row.contributor ?? { display_name: 'Unknown', email: '' },
  };

  return NextResponse.json(recording);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { status, review_note } = await req.json() as {
    status: RecordingStatus;
    review_note: string | null;
  };

  await db
    .update(schema.recordings)
    .set({ status, review_note, reviewed_at: new Date().toISOString() })
    .where(eq(schema.recordings.id, id));

  return NextResponse.json({ ok: true });
}
