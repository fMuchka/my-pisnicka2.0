import { CHORD_QUALITIES, CHORD_ROOTS, CHROMATIC_SCALE, FINGER_POSITIONS } from './chords.database';
import { CHORD_NAMES, isChord } from './finger-positions/types';

const CHORD_REGEX = /^([A-GH])([#b]?)([^/]*)(?:\/([A-GH])([#b]?))?$/i;

const CHORD_ROOT_SET = new Set<string>(CHORD_ROOTS);
const CHORD_QUALITY_SET = new Set<string>(CHORD_QUALITIES);

const NOTE_TO_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 10,
  H: 11,
};

export const STATIC_CHORD_FILTER_LIST = Array.from(CHORD_NAMES.entries().map((e) => e[0]));

function normalizeRoot(letter: string, accidental: string): string {
  return `${letter.toUpperCase()}${accidental}`;
}

function unwrapChordToken(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

export function normalizeChord(chord: string): string | null {
  const candidate = unwrapChordToken(chord);
  const match = candidate.match(CHORD_REGEX);

  if (!match) {
    return null;
  }

  const root = normalizeRoot(match[1] ?? '', match[2] ?? '');
  const quality = match[3] ?? '';
  const bassRoot = match[4] ? normalizeRoot(match[4], match[5] ?? '') : null;

  if (!CHORD_ROOT_SET.has(root)) {
    return null;
  }

  if (!CHORD_QUALITY_SET.has(quality)) {
    return null;
  }

  if (bassRoot && !CHORD_ROOT_SET.has(bassRoot)) {
    return null;
  }

  return bassRoot ? `${root}${quality}/${bassRoot}` : `${root}${quality}`;
}

export function isSupportedChord(chord: string): boolean {
  return normalizeChord(chord) !== null;
}

function normalizeSemitones(value: number): number {
  const withinOctave = value % 12;

  return withinOctave >= 0 ? withinOctave : withinOctave + 12;
}

function transposeNote(note: string, semitones: number): string {
  const index = NOTE_TO_INDEX[note];

  if (index === undefined) {
    return note;
  }

  const targetIndex = normalizeSemitones(index + semitones);

  return CHROMATIC_SCALE[targetIndex] ?? note;
}

export function transposeChord(chord: string, semitoneShift: number): string {
  const shift = normalizeSemitones(semitoneShift);

  if (shift === 0) {
    return chord;
  }

  const match = chord.match(CHORD_REGEX);

  if (!match) {
    return chord;
  }

  const root = `${(match[1] ?? '').toUpperCase()}${match[2] ?? ''}`;
  const quality = match[3] ?? '';
  const bassRoot = match[4] ? `${(match[4] ?? '').toUpperCase()}${match[5] ?? ''}` : null;

  const transposedRoot = transposeNote(root, shift);
  const transposedBass = bassRoot ? transposeNote(bassRoot, shift) : null;

  return transposedBass
    ? `${transposedRoot}${quality}/${transposedBass}`
    : `${transposedRoot}${quality}`;
}

export function getChordFingerPositions(chord: string, instrument: keyof typeof FINGER_POSITIONS) {
  if (isChord(chord)) {
    const guitarChord = FINGER_POSITIONS[instrument][chord];
    if (guitarChord) {
      return guitarChord;
    }
  }

  return null;
}
