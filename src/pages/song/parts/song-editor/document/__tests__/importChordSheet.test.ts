import { describe, expect, it } from 'vitest';
import {
  importChordSheet,
  looksLikeChordSheet,
  readChordLine,
  readHeading,
} from '../importChordSheet';

describe('readChordLine', () => {
  it('reads chords and the columns they start at', () => {
    expect(readChordLine('G      D   Em7')).toEqual([
      { column: 0, chord: 'G' },
      { column: 7, chord: 'D' },
      { column: 11, chord: 'Em7' },
    ]);
  });

  it('allows bar lines and repeat marks', () => {
    expect(readChordLine('| G | D | 2x')).toEqual([
      { column: 2, chord: 'G' },
      { column: 6, chord: 'D' },
    ]);
  });

  it.each(['Lorem ipsum', 'A tak jsem šel', '', '   ', '| 2x'])(
    'is not a chord line: %j',
    (line) => {
      expect(readChordLine(line)).toBeNull();
    }
  );
});

describe('readHeading', () => {
  it.each([
    ['[Verse 1]', 'verse', ''],
    ['Sloka:', 'verse', ''],
    ['Refrén', 'chorus', ''],
    ['R: Ut enim', 'chorus', 'Ut enim'],
    ['Ref.', 'chorus', ''],
    ['2. Lorem ipsum', 'verse', 'Lorem ipsum'],
    ['Předehra:', 'intro', ''],
    ['(Bridge)', 'bridge', ''],
  ])('reads %j', (line, type, rest) => {
    expect(readHeading(line)).toEqual({ type, rest });
  });

  it.each(['Rock and roll', 'R tak', 'Refrén zní dál', '2 Lorem', 'Lorem ipsum'])(
    'leaves lyrics alone: %j',
    (line) => {
      expect(readHeading(line)).toBeNull();
    }
  );
});

describe('looksLikeChordSheet', () => {
  it('spots chords on their own lines', () => {
    expect(looksLikeChordSheet('G   D\nLorem ipsum')).toBe(true);
  });

  it('skips plain lyrics and text already in the app format', () => {
    expect(looksLikeChordSheet('Lorem ipsum\ndolor sit')).toBe(false);
    expect(looksLikeChordSheet('[verse]\n[G]Lorem\nG D')).toBe(false);
  });
});

describe('importChordSheet', () => {
  it('puts each chord before the letter under it', () => {
    expect(importChordSheet('G     D\nLorem ipsum')).toBe('[verse]\n[G]Lorem [D]ipsum');
  });

  it('pads lyrics when a chord sits past their end', () => {
    expect(importChordSheet('G          D\nLorem')).toBe('[verse]\n[G]Lorem      [D]');
  });

  it('turns songbook headings into sections', () => {
    const sheet = [
      'Intro:',
      'G  D',
      '',
      '   G     D',
      '1. Lorem ipsum',
      '',
      'R:',
      'C     G',
      'Ut enim',
    ].join('\n');

    expect(importChordSheet(sheet)).toBe(
      [
        '[intro]',
        '[G]   [D]',
        '',
        '[verse]',
        '[G]Lorem [D]ipsum',
        '',
        '[chorus]',
        '[C]Ut eni[G]m',
      ].join('\n')
    );
  });

  it('keeps lyrics without chords as they are', () => {
    expect(importChordSheet('[Chorus]\nG\nLorem\ndolor sit')).toBe('[chorus]\n[G]Lorem\ndolor sit');
  });

  it('makes sections of blank-line separated blocks when there are no headings', () => {
    expect(importChordSheet('G\nLorem\n\n\nD\nIpsum')).toBe(
      '[verse]\n[G]Lorem\n\n[verse]\n[D]Ipsum'
    );
  });

  it('leaves text already in the app format alone', () => {
    expect(importChordSheet('[verse]\n[G]Lorem\r\n')).toBe('[verse]\n[G]Lorem');
  });
});
