import { useEffect, useState } from 'react';
import { fetchAllSongCategories } from '../../lib/song';

/**
 * Every tag already used in the app, for the editor to suggest. Starts empty and stays empty if
 * loading fails: suggestions are a convenience, the editor works without them.
 */
export function useTagSuggestions(): string[] {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchAllSongCategories()
      .then((categories) => {
        if (!cancelled) setSuggestions(categories.map((category) => category.value));
      })
      .catch(() => {
        // No suggestions then.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return suggestions;
}
