import { transposeChord } from '../../lib/chords/chords';
import { getRenderParts, type RenderPart } from '../../lib/songTextEditor/editableChordDocument';
import { parseMarkdownSections, type SectionType } from '../../lib/songTextEditor/sections';

export type SheetLine = {
  parts: RenderPart[];
  hasChords: boolean;
};

export type SheetSection = {
  /** Null for text without any `[verse]`-style headings. */
  type: SectionType | null;
  lines: SheetLine[];
};

// Tabs depend on tab stops, so they become spaces to keep chord alignment predictable.
const toSheetLine = (line: string, transpose: number): SheetLine => {
  const parts = getRenderParts(line.replace(/\t/g, '    ')).map((part) =>
    part.chord ? { ...part, chord: transposeChord(part.chord, transpose) } : part
  );

  return { parts, hasChords: parts.some((part) => part.chord) };
};

const toSheetLines = (text: string, transpose: number) =>
  text
    .replace(/^\s*\n/, '')
    .trimEnd()
    .split('\n')
    .map((line) => toSheetLine(line, transpose));

/** Splits song text into sections of chord-annotated lines, with chords shifted by `transpose` semitones. */
export function toSheetSections(text: string, transpose = 0): SheetSection[] {
  if (!text.trim()) {
    return [];
  }

  const sections = parseMarkdownSections(text);

  if (sections.length === 0) {
    return [{ type: null, lines: toSheetLines(text, transpose) }];
  }

  return sections
    .filter((section) => section.text.trim().length > 0)
    .map((section) => ({ type: section.type, lines: toSheetLines(section.text, transpose) }));
}
