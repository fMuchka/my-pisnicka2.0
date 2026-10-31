import { normalizeChord } from '../../../../../lib/chords/chords';
import type { SectionType } from '../../../../../lib/songTextEditor/sections';
import { placeChord, serializeLine, type DocumentLine } from './songDocument';

// Songs copied from the web usually put each chord on its own line, above the letter it belongs
// to. This turns that into the app's format: chords inline (`[Am]slovo`) and `[verse]` headings,
// recognising the headings Czech songbooks use too ("1.", "R:", "Ref.", "Sloka").

/** Chord-line filler that isn't a chord but doesn't make it lyrics either: bar lines, repeats. */
const isFiller = (token: string) => /^[|/%:-]+$/.test(token) || /^\(?x?\d{1,2}x?\)?$/i.test(token);

const HEADING_WORDS: Record<string, SectionType> = {
  verse: 'verse',
  sloka: 'verse',
  strofa: 'verse',
  chorus: 'chorus',
  refren: 'chorus',
  ref: 'chorus',
  r: 'chorus',
  bridge: 'bridge',
  mezihra: 'bridge',
  intro: 'intro',
  uvod: 'intro',
  predehra: 'intro',
  outro: 'outro',
  zaver: 'outro',
  dohra: 'outro',
  coda: 'outro',
};

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('cs');

type ChordToken = { column: number; chord: string };

/** The chords of a chord line with the columns they start at; null when it's not a chord line. */
export function readChordLine(line: string): ChordToken[] | null {
  const chords: ChordToken[] = [];

  for (const token of line.matchAll(/\S+/g)) {
    const chord = normalizeChord(token[0]);
    if (chord) {
      chords.push({ column: token.index, chord });
    } else if (!isFiller(token[0])) {
      return null;
    }
  }

  return chords.length > 0 ? chords : null;
}

type Heading = { type: SectionType; rest: string };

/** Takes `pattern` off the start of `text`: what matched (or '') and what's left after it. */
const takeStart = (text: string, pattern: RegExp): [string, string] => {
  const match = pattern.exec(text);
  return match ? [match[0], text.slice(match[0].length).trimStart()] : ['', text];
};

/**
 * A section heading at the start of a line: "[Chorus]", "Sloka 2:", "Refrén", "R: lyrics…",
 * "2. lyrics…". `rest` is any lyrics after it on the same line.
 */
export function readHeading(line: string): Heading | null {
  const [opener, body] = takeStart(line.trim(), /^[[(]/);
  const [word, afterWord] = takeStart(body, /^(\p{L}+|\d+)/u);
  if (!word) return null;

  // "1." starts a verse, but only with the dot: a bare number is lyrics.
  if (/^\d/.test(word)) {
    const [dot, rest] = takeStart(afterWord, /^\./);
    return dot ? { type: 'verse', rest: rest.trim() } : null;
  }

  const type = HEADING_WORDS[fold(word)];
  if (!type) return null;

  // "Sloka 2", then a closing bracket and/or a colon or dot.
  const [, afterNumber] = takeStart(afterWord, /^\d+/);
  const [closer, afterCloser] = takeStart(afterNumber, /^[\])]/);
  const [delimiter, rest] = takeStart(afterCloser, /^[:.]/);
  const marked = Boolean(opener || closer || delimiter);

  // A one-letter "R" needs a mark, and so do lyrics after a heading, or "Refrén zní…" and
  // "R tak" would be read as headings.
  if ((word.length === 1 || rest.trim() !== '') && !marked) return null;

  return { type, rest: rest.trim() };
}

/** Puts the chords of a chord line above `lyrics`, padding the line when a chord reaches past it. */
const mergeChords = (chords: ChordToken[], lyrics: string, shift = 0): string => {
  let line: DocumentLine = { lyrics, chords: [] };

  for (const { column, chord } of chords) {
    const offset = Math.max(0, column - shift);
    if (offset > line.lyrics.length) line = { ...line, lyrics: line.lyrics.padEnd(offset) };
    line = placeChord(line, offset, chord);
  }

  return serializeLine(line);
};

/** Text that already uses the app's inline `[Am]` chords needs no converting. */
const hasInlineChords = (text: string) =>
  [...text.matchAll(/\[([^\]\n]{1,24})\]/g)].some((match) => normalizeChord(match[1] ?? ''));

/** Whether pasted text has chords on their own lines, so converting it is worth offering. */
export function looksLikeChordSheet(text: string): boolean {
  return !hasInlineChords(text) && text.split(/\r?\n/).some((line) => readChordLine(line));
}

/** What one or two input lines became, and whether they held a section heading. */
type Converted = { lines: string[]; consumed: number; heading: boolean };

const convertPlainLine = (line: string): Converted => {
  const heading = readHeading(line);
  if (!heading) return { lines: [line.trimEnd()], consumed: 1, heading: false };

  const lines = heading.rest ? [`[${heading.type}]`, heading.rest] : [`[${heading.type}]`];
  return { lines, consumed: 1, heading: true };
};

/** A chord line, merged into the lyrics line under it when there is one. */
const convertChordLine = (chords: ChordToken[], next: string | undefined): Converted => {
  const nextHeading = next === undefined ? null : readHeading(next);
  const nextIsLyrics =
    next !== undefined &&
    next.trim() !== '' &&
    !readChordLine(next) &&
    !(nextHeading && !nextHeading.rest);

  // Chords with no lyrics under them (an intro, an interlude): kept in place on their own line.
  if (!nextIsLyrics) return { lines: [mergeChords(chords, '')], consumed: 1, heading: false };

  if (!nextHeading) {
    return { lines: [mergeChords(chords, next.trimEnd())], consumed: 2, heading: false };
  }

  // "1. Lorem…" under a chord line: the chords were aligned with the whole line, number included,
  // so they shift left by where the lyrics start (they run to the line end).
  const lyricsStart = next.trimEnd().length - nextHeading.rest.length;
  return {
    lines: [`[${nextHeading.type}]`, mergeChords(chords, nextHeading.rest, lyricsStart)],
    consumed: 2,
    heading: true,
  };
};

/** Without any headings, blocks separated by blank lines become sections to label afterwards. */
const sectionsFromBlocks = (lines: string[]): string[] =>
  lines
    .join('\n')
    .split(/\n\s*\n/)
    .filter((block) => block.trim() !== '')
    .flatMap((block) => ['[verse]', ...block.split('\n'), '']);

/** Converts chords-above-lyrics text into the app's song text. */
export function importChordSheet(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').replaceAll('\t', '    ').split('\n');
  if (hasInlineChords(text)) return lines.join('\n').trim();

  const output: string[] = [];
  let hasHeadings = false;

  for (let index = 0; index < lines.length; ) {
    const line = lines[index] ?? '';
    const chords = readChordLine(line);
    const converted = chords ? convertChordLine(chords, lines[index + 1]) : convertPlainLine(line);

    output.push(...converted.lines);
    hasHeadings ||= converted.heading;
    index += converted.consumed;
  }

  const tidied = output
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .split('\n');

  return (hasHeadings ? tidied : sectionsFromBlocks(tidied)).join('\n').trim();
}
