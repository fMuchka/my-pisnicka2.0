import type { Chord as SVGuitarChordDetails } from 'svguitar';
import { CHORD_QUALITIES, CHORD_ROOTS } from '../chords.database';

export type ChordRoot = (typeof CHORD_ROOTS)[number];
export type ChordQuality = (typeof CHORD_QUALITIES)[number];
export type ChordName = `${ChordRoot}${ChordQuality}`;
export type ChordDiagramDetails = {
  [chordKey in ChordName]: SVGuitarChordDetails;
};

export const CHORD_NAMES = new Set<ChordName>(
  CHORD_ROOTS.flatMap((root) => CHORD_QUALITIES.map((quality) => `${root}${quality}` as ChordName))
);

export function isChord(candidate: string): candidate is ChordName {
  return CHORD_NAMES.has(candidate as ChordName);
}
