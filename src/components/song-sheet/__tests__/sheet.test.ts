import { describe, expect, it } from 'vitest';
import { toSheetSections } from '../sheet';

describe('toSheetSections', () => {
  it('returns nothing for blank text', () => {
    expect(toSheetSections('  \n ')).toEqual([]);
  });

  it('keeps text without section headings as one untyped section', () => {
    const [section, ...rest] = toSheetSections('[C]Ahoj světe\nbez akordů');

    expect(rest).toEqual([]);
    expect(section?.type).toBeNull();
    expect(section?.lines).toHaveLength(2);
    expect(section?.lines[0]?.hasChords).toBe(true);
    expect(section?.lines[1]?.hasChords).toBe(false);
  });

  it('splits text into typed sections and drops empty ones', () => {
    const sections = toSheetSections('[verse]\n[C]Sloka\n\n[chorus]\n\n[bridge]\n[G]Mezihra');

    expect(sections.map((section) => section.type)).toEqual(['verse', 'bridge']);
  });

  it('accepts Czech section labels as headings', () => {
    expect(toSheetSections('[Refrén]\nla la')[0]?.type).toBe('chorus');
  });

  it('anchors a chord to the word after it', () => {
    const line = toSheetSections('[Am]Kometo, kometo')[0]?.lines[0];

    expect(line?.parts[0]).toEqual({ chord: 'Am', text: 'Kometo,' });
    expect(line?.parts.slice(1).every((part) => part.chord === undefined)).toBe(true);
  });

  it('transposes every chord', () => {
    const chords = toSheetSections('[C]a [G]b [Am]c', 2)[0]
      ?.lines[0]?.parts.filter((part) => part.chord)
      .map((part) => part.chord);

    expect(chords).toEqual(['D', 'A', 'Hm']);
  });

  it('trims blank lines around a section but keeps the inner ones', () => {
    const lines = toSheetSections('[verse]\n\nprvní\n\ndruhá\n\n')[0]?.lines;

    expect(lines?.map((line) => line.parts.map((part) => part.text).join(''))).toEqual([
      'první',
      '',
      'druhá',
    ]);
  });

  it('turns tabs into spaces', () => {
    const text = toSheetSections('a\tb')[0]
      ?.lines[0]?.parts.map((part) => part.text)
      .join('');

    expect(text).toBe('a    b');
  });
});
