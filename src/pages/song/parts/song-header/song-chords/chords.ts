import { transposeChord } from '../../../../../lib/chords/chords';
import type { Song } from '../../../../../lib/song';
import { extractUniqueChords } from '../../../../../lib/songTextEditor/chords';

/** Unique chords of the song, shifted by `transpose` semitones. Falls back to the text when the stored list is empty. */
export function songChords(song: Pick<Song, 'chords' | 'text'>, transpose: number): string[] {
  const chords = song.chords?.length ? song.chords : extractUniqueChords(song.text ?? '');

  return [...new Set(chords.map((chord) => transposeChord(chord, transpose)))];
}
