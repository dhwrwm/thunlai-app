import { Suspense } from 'react';
import { db, schema } from '@thunlai/db';
import { eq, sql } from 'drizzle-orm';
import SearchBar from '@/components/SearchBar';
import WordCard from '@/components/WordCard';

const ALPHABET = 'अ आ इ ई उ ऊ ए ओ क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व स ह'.split(' ');

async function WordOfDay() {
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.words)
    .where(eq(schema.words.source, 'dictionary'));

  if (!count) return null;

  const dayOffset = Math.floor(Date.now() / 86400000) % count;
  const [word] = await db
    .select()
    .from(schema.words)
    .where(eq(schema.words.source, 'dictionary'))
    .offset(dayOffset)
    .limit(1);

  if (!word) return null;

  return (
    <section className="mb-10 rounded-2xl bg-primary-light p-6 ring-1 ring-primary/20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
        Word of the Day
      </p>
      <a href={`/word/${word.id}`} className="group block">
        <p className="font-devanagari text-4xl font-bold leading-snug text-gray-900 group-hover:text-primary">
          {word.bodo}
        </p>
        {word.roman && (
          <p className="mt-1 text-sm italic text-primary-dark">/{word.roman}/</p>
        )}
        <p className="mt-2 text-gray-700">{word.english}</p>
      </a>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Bodo ↔ English Dictionary
        </h1>
        <p className="text-gray-500">10,000+ entries · Free · Open source</p>
      </div>

      <SearchBar />

      <Suspense fallback={<div className="mb-10 h-36 animate-pulse rounded-2xl bg-gray-100" />}>
        <WordOfDay />
      </Suspense>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Browse by Letter
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALPHABET.map((letter) => (
            <a
              key={letter}
              href={`/browse/${encodeURIComponent(letter)}`}
              className="font-devanagari flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-semibold hover:border-primary hover:text-primary"
            >
              {letter}
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
