// Case and accents don't matter when matching: "tabo" finds "Táborák".
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('cs')
    .trim();

/**
 * The suggestions containing `query`, best first (the ones starting with it), leaving out tags
 * already picked. Nothing until something is typed.
 */
export function matchSuggestions(
  suggestions: string[],
  query: string,
  picked: string[],
  limit = 6
): string[] {
  const foldedQuery = fold(query);
  if (foldedQuery === '') return [];

  const pickedFolded = new Set(picked.map(fold));

  return suggestions
    .map((suggestion) => ({ suggestion, folded: fold(suggestion) }))
    .filter(({ folded }) => !pickedFolded.has(folded) && folded.includes(foldedQuery))
    .sort(
      (a, b) => Number(b.folded.startsWith(foldedQuery)) - Number(a.folded.startsWith(foldedQuery))
    )
    .slice(0, limit)
    .map(({ suggestion }) => suggestion);
}
