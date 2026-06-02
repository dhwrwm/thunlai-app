import Link from 'next/link';
import type { Word } from '@thunlai/types';

export default function WordCard({ word }: { word: Word }) {
  return (
    <Link
      href={`/word/${word.id}`}
      className="mb-2 flex flex-col rounded-xl border border-gray-200 bg-white p-4 hover:border-primary hover:shadow-sm"
    >
      <p className="font-devanagari text-lg font-semibold text-gray-900">{word.bodo}</p>
      {word.roman && (
        <p className="text-xs italic text-primary-dark">/{word.roman}/</p>
      )}
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{word.english}</p>
    </Link>
  );
}
