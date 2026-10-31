import { describe, expect, it } from 'vitest';
import type { Song } from '../../../../../lib/song';
import { emptyDraft, isDraftValid, isValidCapo, parseCapo, toDraft } from '../draft';
import type { SongDraft } from '../types';

const draft: SongDraft = {
  title: 'Kometa',
  artist: 'Nohavica',
  capo: '',
  text: '',
  instrument: 'guitar',
  tags: [],
};

describe('song draft', () => {
  it('starts a new song for the given instrument, without tags', () => {
    expect(emptyDraft('ukulele')).toEqual({
      title: '',
      artist: '',
      capo: '',
      text: '',
      instrument: 'ukulele',
      tags: [],
    });
  });

  it('copies a song and its tags into a draft, capo as text', () => {
    const song: Song = {
      id: 's1',
      title: 'Kometa',
      artist: 'Nohavica',
      text: '[C]text',
      capo: 2,
      instrument: 'ukulele',
      ownerId: 'u1',
    };

    expect(toDraft(song, ['folk'])).toEqual({
      title: 'Kometa',
      artist: 'Nohavica',
      capo: '2',
      text: '[C]text',
      instrument: 'ukulele',
      tags: ['folk'],
    });
    expect(
      toDraft({ ...song, capo: undefined, text: undefined, instrument: undefined }, null)
    ).toMatchObject({ capo: '', text: '', instrument: '', tags: null });
  });

  it.each(['', ' ', '0', '3', ' 12 '])('accepts capo %j', (capo) => {
    expect(isValidCapo(capo)).toBe(true);
  });

  it.each(['-1', '1.5', 'abc', '2a'])('rejects capo %j', (capo) => {
    expect(isValidCapo(capo)).toBe(false);
  });

  it('parses capo, leaving it out when empty', () => {
    expect(parseCapo(' 4 ')).toBe(4);
    expect(parseCapo('  ')).toBeUndefined();
  });

  it('needs a title, an artist and a valid capo', () => {
    expect(isDraftValid(draft)).toBe(true);
    expect(isDraftValid({ ...draft, title: '  ' })).toBe(false);
    expect(isDraftValid({ ...draft, artist: '' })).toBe(false);
    expect(isDraftValid({ ...draft, capo: 'x' })).toBe(false);
  });
});
