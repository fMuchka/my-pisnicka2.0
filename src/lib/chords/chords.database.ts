import { GUITAR_FINGER_POSITIONS } from './finger-positions/guitar';
export const CHORD_ROOTS = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
  'H',
] as const;

export const CHORD_QUALITIES = [
  '', // dur (major triad)
  'm',
  //   '5',
  //   '6',
  //   'm6',
  '7',
  'maj7',
  'm7',
  //   'mMaj7',
  'sus2',
  'sus4',
  //   '7sus4',
  'add9',
  //   'madd9',
  //   '9',
  //   'm9',
  //   '11',
  //   '13',
  //   'dim',
  //   'dim7',
  //   'aug',
  //   'm7b5',
] as const;

export const CHROMATIC_SCALE = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'B',
  'H',
] as const;

export const FINGER_POSITIONS = {
  guitar: GUITAR_FINGER_POSITIONS,
};
