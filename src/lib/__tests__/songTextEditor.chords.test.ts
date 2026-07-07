import { describe, expect, it } from 'vitest';
import { extractUniqueChords, toVisualChordText } from '../songTextEditor/chords';

describe('songTextEditor/chords', () => {
  it('keeps stored bracketed chords and avoids Czech-word false positives', () => {
    const input = 'Ahoj [C]město je velké a [G]máma vaří oběd.';

    expect(extractUniqueChords(input)).toEqual(['C', 'G']);
  });

  it('extracts plain visual chords and slash chords', () => {
    const input = 'Line with D/F# then Hm7 and Cmaj7 in text';

    expect(extractUniqueChords(input)).toEqual(['D/F#', 'Hm7', 'Cmaj7']);
  });

  it('normalizes bracketed visual tokens to plain chords', () => {
    const input = '[Am] mama [D/F#] line';

    expect(toVisualChordText(input)).toBe('Am mama D/F# line');
  });

  it('ignores chord-like tokens that are not in chords.database', () => {
    const input = '[Random] line with Hm9 and [Gaug] plus BmMaj7';

    expect(extractUniqueChords(input)).toEqual([]);
  });
});
