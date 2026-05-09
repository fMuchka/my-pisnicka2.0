import { CHORD_ROOTS, CHROMATIC_SCALE, FINGER_POSITIONS } from './chords.database';
import { CHORD_NAMES, isChord } from './finger-positions/types';

const CHORD_REGEX = /^([A-GH])([#b]?)([^/]*)(?:\/([A-GH])([#b]?))?$/i;

export const STATIC_CHORD_FILTER_LIST = Array.from(CHORD_NAMES.entries().map((e) => e[0]));

function normalizeSemitones(value: number): number {
  const withinOctave = value % 12;

  return withinOctave >= 0 ? withinOctave : withinOctave + 12;
}

function transposeNote(note: string, semitones: number): string {
  const index = CHORD_ROOTS.findIndex((e) => e === note);

  if (index === undefined) {
    return note;
  }

  const targetIndex = (index + semitones) % CHROMATIC_SCALE.length;

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
