import type { Song } from '../../lib/song';

const normalize = (value: string) => value.trim().toLocaleLowerCase('cs');

/** Plain substring match on artist or title; an empty query matches everything. */
export const matchesQuery = (song: Pick<Song, 'artist' | 'title'>, query: string) => {
  const q = normalize(query);

  return !q || normalize(song.artist).includes(q) || normalize(song.title).includes(q);
};

/** Picks the Czech plural form: 1 → one, 2–4 → few, else many. */
const plural = (count: number, one: string, few: string, many: string) => {
  if (count === 1) return one;
  if (count >= 2 && count <= 4) return few;
  return many;
};

export const formatResultCount = (count: number, query: string) => {
  const q = query.trim();

  if (q) {
    return `${count} ${plural(count, 'výsledek', 'výsledky', 'výsledků')} pro „${q}“`;
  }

  return `${count} ${plural(count, 'píseň', 'písně', 'písní')}`;
};
