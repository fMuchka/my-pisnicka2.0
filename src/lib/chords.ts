const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'B', 'H'] as const;

const NOTE_INDEX: Record<string, number> = {
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

const CHORD_REGEX = /^([A-GH])([#b]?)([^/]*)(?:\/([A-GH])([#b]?))?$/i;

function normalizeSemitones(value: number): number {
  const withinOctave = value % 12;

  return withinOctave >= 0 ? withinOctave : withinOctave + 12;
}

function transposeNote(note: string, semitones: number): string {
  const index = NOTE_INDEX[note];

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
