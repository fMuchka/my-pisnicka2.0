import { normalizeChord } from '../../../../../lib/chords/chords';
import {
  sectionHeading,
  sectionTypeOptions,
  sectionLabel,
  type SectionType,
} from '../../../../../lib/songTextEditor/sections';

// The editors work on this structure; the song is still saved as text: `[verse]` headings and
// `[Am]` chords inline in the lyrics. parse/serialize convert between the two.

/** A chord shown above the lyrics, before the character at `offset` (or at the line end). */
export type PlacedChord = { offset: number; chord: string };

export type DocumentLine = {
  lyrics: string;
  /** Sorted by offset. */
  chords: PlacedChord[];
};

export type DocumentSection = {
  /** null for text before the first heading. */
  type: SectionType | null;
  lines: DocumentLine[];
};

export type SongDocument = DocumentSection[];

// Bounded: no chord name is that long, and it keeps the match cheap on any input.
const CHORD_TOKEN = /\[([^\]\n]{1,24})\]/g;

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase('cs')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

/** The section type a `[verse]` / `[Sloka 2]` heading line stands for, else null. */
export function parseHeading(line: string): SectionType | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;

  // "Sloka 2" is a verse too.
  const token = normalizeToken(
    trimmed
      .slice(1, -1)
      .trim()
      .replace(/\s\d+$/, '')
  );

  return (
    sectionTypeOptions.find(
      (type) => normalizeToken(type) === token || normalizeToken(sectionLabel(type)) === token
    ) ?? null
  );
}

/** Splits a stored line into its lyrics and the chords placed in it. Unknown `[...]` stays as text. */
export function parseLine(line: string): DocumentLine {
  let lyrics = '';
  const chords: PlacedChord[] = [];
  let index = 0;

  for (const match of line.matchAll(CHORD_TOKEN)) {
    const chord = normalizeChord(match[1] ?? '');
    if (chord === null) continue;

    lyrics += line.slice(index, match.index);
    chords.push({ offset: lyrics.length, chord });
    index = match.index + match[0].length;
  }

  lyrics += line.slice(index);

  return { lyrics, chords };
}

export function serializeLine({ lyrics, chords }: DocumentLine): string {
  let result = '';
  let index = 0;

  for (const { offset, chord } of chords) {
    result += `${lyrics.slice(index, offset)}[${chord}]`;
    index = offset;
  }

  return result + lyrics.slice(index);
}

export function parseSongDocument(text: string): SongDocument {
  const sections: SongDocument = [];
  let current: DocumentSection | null = null;

  for (const line of text.replace(/\r\n?/g, '\n').replaceAll('\t', '    ').split('\n')) {
    const heading = parseHeading(line);

    if (heading) {
      current = { type: heading, lines: [] };
      sections.push(current);
      continue;
    }

    if (current === null) {
      current = { type: null, lines: [] };
      sections.push(current);
    }

    current.lines.push(parseLine(line));
  }

  // An empty song, or nothing but whitespace before the first heading, is no section.
  return sections.filter(
    (section) =>
      section.type !== null ||
      section.lines.some((line) => line.lyrics.trim() || line.chords.length)
  );
}

export function serializeSongDocument(document: SongDocument): string {
  return document
    .flatMap((section) => [
      ...(section.type ? [sectionHeading(section.type)] : []),
      ...section.lines.map(serializeLine),
    ])
    .join('\n');
}

/** The chords used in the song, each once, in the order they first appear. */
export function documentChords(document: SongDocument): string[] {
  const chords = document.flatMap((section) =>
    section.lines.flatMap((line) => line.chords.map(({ chord }) => chord))
  );

  return [...new Set(chords)];
}

export const sectionLyrics = (section: DocumentSection) =>
  section.lines.map((line) => line.lyrics).join('\n');

export const emptyLine = (): DocumentLine => ({ lyrics: '', chords: [] });

/** Puts `chord` before the character at `offset`, replacing a chord already there. */
export function placeChord(line: DocumentLine, offset: number, chord: string): DocumentLine {
  const chords = line.chords.filter((placed) => placed.offset !== offset);
  chords.push({ offset, chord });
  chords.sort((a, b) => a.offset - b.offset);

  return { ...line, chords };
}

/**
 * Adds `chord` after everything on the line. If the line already ends with a chord (an intro of
 * chords only, say), spaces go in first so the two sit side by side instead of replacing.
 */
export function appendChord(line: DocumentLine, chord: string): DocumentLine {
  const lastChord = chordAt(line, line.lyrics.length);
  const lyrics = lastChord ? line.lyrics + ' '.repeat(lastChord.length + 1) : line.lyrics;

  return placeChord({ ...line, lyrics }, lyrics.length, chord);
}

export function removeChord(line: DocumentLine, offset: number): DocumentLine {
  return { ...line, chords: line.chords.filter((placed) => placed.offset !== offset) };
}

export const chordAt = (line: DocumentLine, offset: number) =>
  line.chords.find((placed) => placed.offset === offset)?.chord ?? null;
