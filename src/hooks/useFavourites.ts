import { useState, useCallback, useEffect } from 'react';
import { toggleFavourite, getFavourites } from '../utils/db';
import type { Word } from '../utils/db';

export function useFavourites() {
  const [favIds, setFavIds] = useState<Set<number>>(new Set());

  const loadFavs = useCallback(async () => {
    const favs = await getFavourites();
    setFavIds(new Set(favs.map((w) => w.id)));
  }, []);

  useEffect(() => {
    loadFavs();
  }, []);

  const toggle = useCallback(async (wordId: number) => {
    const isNowFav = await toggleFavourite(wordId);
    setFavIds((prev) => {
      const next = new Set(prev);
      if (isNowFav) next.add(wordId);
      else next.delete(wordId);
      return next;
    });
    return isNowFav;
  }, []);

  return { favIds, toggle, reload: loadFavs };
}
