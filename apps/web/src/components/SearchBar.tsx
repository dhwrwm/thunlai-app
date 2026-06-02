'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Word } from '@thunlai/types';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Word[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data: Word[] = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={ref} className="relative mb-8">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Bodo, Roman, or English…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-11 pr-4 text-base shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            ...
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {results.map((word) => (
            <li key={word.id}>
              <button
                className="flex w-full flex-col px-4 py-3 text-left hover:bg-gray-50"
                onClick={() => { router.push(`/word/${word.id}`); setOpen(false); setQuery(''); }}
              >
                <span className="font-devanagari text-base font-semibold text-gray-900">{word.bodo}</span>
                {word.roman && (
                  <span className="text-xs italic text-primary-dark">/{word.roman}/</span>
                )}
                <span className="mt-0.5 text-sm text-gray-500 line-clamp-1">{word.english}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 shadow-xl">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
