import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@thunlai/db';
import { or, ilike, asc } from 'drizzle-orm';
import type { Word } from '@thunlai/types';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  const like = `%${q}%`;

  try {
    const results = await db
      .select()
      .from(schema.words)
      .where(
        or(
          ilike(schema.words.bodo, like),
          ilike(schema.words.roman, like),
          ilike(schema.words.english, like)
        )
      )
      .orderBy(asc(schema.words.source))
      .limit(30);

    return NextResponse.json(results as Word[]);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
