import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, schema } from '@thunlai/db';
import { eq, ne, ilike, or, sql } from 'drizzle-orm';
import WordCard from '@/components/WordCard';
import type { Word } from '@thunlai/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [word] = await db
    .select({ bodo: schema.words.bodo, english: schema.words.english })
    .from(schema.words)
    .where(eq(schema.words.id, Number(id)))
    .limit(1);

  if (!word) return { title: 'Word not found' };
  return { title: word.bodo, description: word.english };
}

async function getSimilarWords(word: Word): Promise<Word[]> {
  const tokens = word.english
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 3)
    .slice(0, 3)
    .join(' | ');

  if (!tokens) return [];

  return db
    .select()
    .from(schema.words)
    .where(
      sql`${schema.words.fts} @@ to_tsquery('simple', ${tokens})
          AND ${schema.words.id} != ${word.id}
          AND ${schema.words.source} = ${word.source}`
    )
    .limit(5) as Promise<Word[]>;
}

export default async function WordDetailPage({ params }: Props) {
  const { id } = await params;
  const [word] = await db
    .select()
    .from(schema.words)
    .where(eq(schema.words.id, Number(id)))
    .limit(1);

  if (!word) notFound();

  const similar = await getSimilarWords(word as Word);
  const isDict = word.source === 'dictionary';

  return (
    <div className="max-w-2xl">
      <a href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
        ← Back
      </a>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="font-devanagari text-4xl font-bold leading-snug text-gray-900">{word.bodo}</p>
        {word.roman && (
          <p className="mt-1 text-sm italic text-primary-dark">/{word.roman}/</p>
        )}

        <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${
          isDict ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
        }`}>
          {isDict ? '📖 Dictionary' : '📚 Glossary'}
        </span>

        <hr className="my-5 border-gray-100" />

        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">English</p>
        <p className="text-lg leading-relaxed text-gray-800">{word.english}</p>
      </div>

      {word.slug && (
        <a
          href={`https://bihung.org/define/${word.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm font-medium text-primary hover:bg-primary-light"
        >
          🌐 View on bihung.org
        </a>
      )}

      {similar.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Similar Words
          </h2>
          {similar.map((w) => (
            <WordCard key={w.id} word={w} />
          ))}
        </section>
      )}
    </div>
  );
}
