import { describe, expect, it } from 'vitest';
import {
  appendChord,
  chordAt,
  documentChords,
  parseHeading,
  parseLine,
  parseSongDocument,
  placeChord,
  removeChord,
  sectionLyrics,
  serializeLine,
  serializeSongDocument,
} from '../songDocument';

describe('parseLine / serializeLine', () => {
  it('splits a line into lyrics and the chords above them', () => {
    expect(parseLine('[Am]Lorem conse[D]ctetur')).toEqual({
      lyrics: 'Lorem consectetur',
      chords: [
        { offset: 0, chord: 'Am' },
        { offset: 11, chord: 'D' },
      ],
    });
  });

  it('keeps unknown brackets as text', () => {
    expect(parseLine('[2x] Lorem [Am]ipsum')).toEqual({
      lyrics: '[2x] Lorem ipsum',
      chords: [{ offset: 11, chord: 'Am' }],
    });
  });

  it('normalizes chord spelling', () => {
    expect(parseLine('[am]x').chords).toEqual([{ offset: 0, chord: 'Am' }]);
  });

  it.each(['[Am]Lorem conse[D]ctetur', '[G] [D] [Am]', 'bez akordů', '', 'konec[C]'])(
    'round-trips %j',
    (line) => {
      expect(serializeLine(parseLine(line))).toBe(line);
    }
  );
});

describe('parseHeading', () => {
  it.each([
    ['[verse]', 'verse'],
    ['[Sloka]', 'verse'],
    ['[Sloka 2]', 'verse'],
    [' [refrén] ', 'chorus'],
    ['[chorus]', 'chorus'],
  ])('reads %j as %s', (line, type) => {
    expect(parseHeading(line)).toBe(type);
  });

  it.each(['[Am]', 'verse', '[neznámé]', '[verse] text'])('ignores %j', (line) => {
    expect(parseHeading(line)).toBeNull();
  });
});

describe('parseSongDocument / serializeSongDocument', () => {
  const text = ['[verse]', '[Am]Lorem ipsum', 'dolor [C]sit', '', '[chorus]', 'Ut [G]enim'].join(
    '\n'
  );

  it('splits the song into sections of lines', () => {
    const document = parseSongDocument(text);

    expect(document.map((section) => section.type)).toEqual(['verse', 'chorus']);
    expect(sectionLyrics(document[0]!)).toBe('Lorem ipsum\ndolor sit\n');
    expect(document[1]!.lines[0]!.chords).toEqual([{ offset: 3, chord: 'G' }]);
  });

  it('round-trips the stored text', () => {
    expect(serializeSongDocument(parseSongDocument(text))).toBe(text);
  });

  it('keeps text before the first heading as a section without a type', () => {
    const document = parseSongDocument('úvodní řádek\n[verse]\nsloka');

    expect(document.map((section) => section.type)).toEqual([null, 'verse']);
    expect(serializeSongDocument(document)).toBe('úvodní řádek\n[verse]\nsloka');
  });

  it('has no sections for an empty song', () => {
    expect(parseSongDocument('')).toEqual([]);
    expect(parseSongDocument('  \n ')).toEqual([]);
  });

  it('turns tabs into spaces', () => {
    expect(parseSongDocument('a\tb')[0]!.lines[0]!.lyrics).toBe('a    b');
  });

  it('lists each chord once, in order of appearance', () => {
    expect(documentChords(parseSongDocument(text))).toEqual(['Am', 'C', 'G']);
  });
});

describe('chord placement', () => {
  const line = parseLine('[Am]Lorem ipsum');

  it('places a chord before a letter, replacing one already there', () => {
    expect(serializeLine(placeChord(line, 6, 'F'))).toBe('[Am]Lorem [F]ipsum');
    expect(serializeLine(placeChord(line, 0, 'C'))).toBe('[C]Lorem ipsum');
  });

  it('removes a chord', () => {
    expect(serializeLine(removeChord(line, 0))).toBe('Lorem ipsum');
  });

  it('finds the chord at a spot', () => {
    expect(chordAt(line, 0)).toBe('Am');
    expect(chordAt(line, 1)).toBeNull();
  });

  it('appends chords at the line end side by side', () => {
    let intro = parseLine('');
    intro = appendChord(intro, 'G');
    intro = appendChord(intro, 'Am');

    expect(serializeLine(intro)).toBe('[G]  [Am]');
  });
});
