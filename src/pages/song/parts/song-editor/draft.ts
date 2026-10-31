import type { Song } from '../../../../lib/song';
import type { SongDraft } from './types';

export const EMPTY_DRAFT: SongDraft = { title: '', artist: '', capo: '', text: '' };

export const toDraft = (song: Song): SongDraft => ({
  title: song.title,
  artist: song.artist,
  capo: song.capo != null ? String(song.capo) : '',
  text: song.text ?? '',
});

/** Empty is fine (no capo); anything else must be a whole number from 0 up. */
export const isValidCapo = (capo: string) => {
  const trimmed = capo.trim();

  return trimmed === '' || /^\d+$/.test(trimmed);
};

export const parseCapo = (capo: string): number | undefined => {
  const trimmed = capo.trim();

  return trimmed === '' ? undefined : Number(trimmed);
};

export const isDraftValid = (draft: SongDraft) =>
  draft.title.trim().length > 0 && draft.artist.trim().length > 0 && isValidCapo(draft.capo);
