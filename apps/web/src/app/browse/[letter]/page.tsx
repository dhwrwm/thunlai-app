import type { Metadata } from 'next';
import { db, schema } from '@thunlai/db';
import { eq, asc, sql } from 'drizzle-orm';
import WordCard from '@/components/WordCard';
import type { Word } from '@thunlai/types';

type Props = { params: Promise<{ letter: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { letter } = await params;
  return { title: `Words starting with ${decodeURIComponent(letter)}` };
}

export default async function BrowsePage({ params }: Props) {
  const { letter: raw } = await params;
  const letter = decodeURIComponent(raw);

  const words = await db
    .select()
    .from(schema.words)
    .where(
      sql`${schema.words.bodo} like ${letter + '%'}
          AND ${schema.words.source} = 'dictionary'`
    )
    .orderBy(asc(schema.words.bodo))
    .limit(100) as Word[];

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <a href="/" className="text-sm text-gray-500 hover:text-primary">← Home</a>
        <span className="font-devanagari text-3xl font-bold text-gray-900">{letter}</span>
        <span className="text-sm text-gray-400">({words.length} words)</span>
      </div>

      {words.length === 0 ? (
        <p className="text-gray-500">No words found for this letter.</p>
      ) : (
        <div>{words.map((word) => <WordCard key={word.id} word={word} />)}</div>
      )}
    </>
  );
}
