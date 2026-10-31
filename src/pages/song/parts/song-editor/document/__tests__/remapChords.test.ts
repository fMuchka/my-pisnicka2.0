import { describe, expect, it } from 'vitest';
import { remapLineChords, remapSectionLines } from '../remapChords';
import { parseLine, serializeLine } from '../songDocument';

/** Edits the lyrics of a stored line and returns the stored line with its chords moved along. */
const editLine = (stored: string, newLyrics: string) => {
  const { lyrics, chords } = parseLine(stored);
  return serializeLine({ lyrics: newLyrics, chords: remapLineChords(lyrics, newLyrics, chords) });
};

const editSection = (stored: string[], newText: string) =>
  remapSectionLines(stored.map(parseLine), newText).map(serializeLine);

describe('remapLineChords', () => {
  it('keeps chords before the change where they are', () => {
    expect(editLine('[Am]Lorem [C]ipsum', 'Lorem ipsum dolor')).toBe('[Am]Lorem [C]ipsum dolor');
  });

  it('shifts chords after the change with their letters', () => {
    expect(editLine('Lorem [C]ipsum', 'Lorem dolor ipsum')).toBe('Lorem dolor [C]ipsum');
    expect(editLine('Lorem dolor [C]ipsum', 'Lorem ipsum')).toBe('Lorem [C]ipsum');
  });

  it('keeps a chord on its letter when typing right in front of it', () => {
    expect(editLine('a [C]slovo', 'a xslovo')).toBe('a x[C]slovo');
  });

  it('keeps a chord whose letter was replaced where the change starts', () => {
    expect(editLine('Lo[F]rem ipsum', 'Lxyz ipsum')).toBe('L[F]xyz ipsum');
  });

  it('keeps a chord at the line end at the end', () => {
    expect(editLine('Lorem[G]', 'Lorem ipsum')).toBe('Lorem ipsum[G]');
  });

  it('keeps one chord when a deletion squeezes two onto the same spot', () => {
    expect(editLine('[C]a[D]b[E]c', 'c')).toBe('[E]c');
  });
});

describe('remapSectionLines', () => {
  const verse = ['[Am]Lorem ipsum', 'dolor [C]sit', '[G]amet'];

  it('leaves untouched lines as they are', () => {
    expect(editSection(verse, 'Lorem ipsum\ndolor sit amet\namet')).toEqual([
      '[Am]Lorem ipsum',
      'dolor [C]sit amet',
      '[G]amet',
    ]);
  });

  it('takes the chords along when Enter splits a line', () => {
    expect(editSection(['[Am]Lorem [C]ipsum'], 'Lorem \nipsum')).toEqual([
      '[Am]Lorem ',
      '[C]ipsum',
    ]);
  });

  it('merges the chords when Backspace joins two lines', () => {
    expect(editSection(['[Am]Lorem ', '[C]ipsum'], 'Lorem ipsum')).toEqual(['[Am]Lorem [C]ipsum']);
  });

  it('drops the chords of a deleted line and keeps the rest', () => {
    expect(editSection(verse, 'Lorem ipsum\namet')).toEqual(['[Am]Lorem ipsum', '[G]amet']);
  });

  it('adds new lines without chords', () => {
    expect(editSection(verse, 'Lorem ipsum\ndolor sit\nnový řádek\namet')).toEqual([
      '[Am]Lorem ipsum',
      'dolor [C]sit',
      'nový řádek',
      '[G]amet',
    ]);
  });

  it('pairs lines up in order when several change at once', () => {
    // "sit" went with its chord's letter, so the chord stays where the change starts.
    expect(editSection(verse, 'Lorem\ndolor')).toEqual(['[Am]Lorem', 'dolor[C]']);
  });
});
