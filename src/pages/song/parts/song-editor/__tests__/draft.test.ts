import { describe, expect, it } from 'vitest';
import type { Song } from '../../../../../lib/song';
import { isDraftValid, isValidCapo, parseCapo, toDraft } from '../draft';

const draft = { title: 'Kometa', artist: 'Nohavica', capo: '', text: '' };

describe('song draft', () => {
  it('copies a song into a draft, capo as text', () => {
    const song: Song = {
      id: 's1',
      title: 'Kometa',
      artist: 'Nohavica',
      text: '[C]text',
      capo: 2,
      ownerId: 'u1',
    };

    expect(toDraft(song)).toEqual({
      title: 'Kometa',
      artist: 'Nohavica',
      capo: '2',
      text: '[C]text',
    });
    expect(toDraft({ ...song, capo: undefined, text: undefined })).toMatchObject({
      capo: '',
      text: '',
    });
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
