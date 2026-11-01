import type { Instrument } from '../../../../lib/chords/chords.database';
import type { SongVisibility } from '../../../../lib/song';

/** Form values of the song editor; capo stays a string until it is validated on save. */
export type SongDraft = {
  title: string;
  artist: string;
  capo: string;
  text: string;
  /** What the chords are written for; '' for older songs that never said. */
  instrument: Instrument | '';
  visibility: SongVisibility;
  /** Tag labels. null when the song's tags could not be loaded: saving then leaves them as they are. */
  tags: string[] | null;
};
