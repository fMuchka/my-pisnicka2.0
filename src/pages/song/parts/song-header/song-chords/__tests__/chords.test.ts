import { describe, expect, it } from 'vitest';
import { songChords } from '../chords';

describe('songChords', () => {
  it('uses the stored chords', () => {
    expect(songChords({ chords: ['G', 'Em'], text: '[C]text' }, 0)).toEqual(['G', 'Em']);
  });

  it('falls back to the chords in the text', () => {
    expect(songChords({ chords: [], text: '[C]Za [Am]sklem [C]výlohy' }, 0)).toEqual(['C', 'Am']);
    expect(songChords({}, 0)).toEqual([]);
  });

  it('transposes the chords and drops the duplicates it makes', () => {
    expect(songChords({ chords: ['C', 'Am'] }, 2)).toEqual(['D', 'Hm']);
    expect(songChords({ chords: ['C#', 'Db'] }, 1)).toHaveLength(1);
  });
});
