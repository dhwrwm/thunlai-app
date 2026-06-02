import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import type { Word } from '@thunlai/types';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  const supabase = createClient();

  const { data, error } = await supabase
    .from('words')
    .select('id,bodo,roman,english,source,slug')
    .or(`bodo.ilike.%${q}%,roman.ilike.%${q}%,english.ilike.%${q}%`)
    .order('source')
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data as Word[]);
}
