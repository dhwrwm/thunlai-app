export type Word = {
  id: number;
  bodo: string;
  roman: string;
  english: string;
  source: 'dictionary' | 'glossary';
  slug: string | null;
};

export type SearchResult = Word & { rank?: number };

const NOT_SUPPORTED = 'SQLite is not supported on web.';

export async function getDb(): Promise<never> { throw new Error(NOT_SUPPORTED); }
export async function initDb(): Promise<void> { throw new Error(NOT_SUPPORTED); }
export async function isSeeded(): Promise<boolean> { return false; }
export async function seedDatabase(): Promise<void> { throw new Error(NOT_SUPPORTED); }
export async function searchWords(): Promise<SearchResult[]> { return []; }
export async function browseByLetter(): Promise<Word[]> { return []; }
export async function getWordById(): Promise<Word | null> { return null; }
export async function getRandomWords(): Promise<Word[]> { return []; }
export async function getWordOfTheDay(): Promise<Word | null> { return null; }
export async function getFavourites(): Promise<Word[]> { return []; }
export async function toggleFavourite(): Promise<boolean> { return false; }
export async function isFavourite(): Promise<boolean> { return false; }
export async function recordView(): Promise<void> {}
export async function getHistory(): Promise<Word[]> { return []; }
export async function clearHistory(): Promise<void> {}
export async function getStats() { return { total: 0, dictionary: 0, glossary: 0, favourites: 0 }; }
