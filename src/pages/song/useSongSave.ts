import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import type { Song } from '../../lib/song';
import Routes from '../../router/Routes';
import type { SongDraft } from './parts/song-editor/types';
import { saveSong } from './saveSong';

/**
 * Saves the editor's draft as the signed-in user: a new song in create mode (then opens it),
 * otherwise an update of `songId`.
 */
export function useSongSave(isCreate: boolean) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // The detail hook does not see saves, so the page shows this one until the next load.
  const [savedSong, setSavedSong] = useState<Song | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Resolves `true` once the song is saved. */
  const save = async (draft: SongDraft, songId?: string) => {
    if (user == null) return false;

    setIsSaving(true);
    setSaveError(null);

    try {
      const saved = await saveSong(draft, user.uid, isCreate ? undefined : songId);
      setSavedSong(saved);

      if (isCreate) {
        void navigate(generatePath(Routes.Song, { songId: saved.id }), { replace: true });
      }

      return true;
    } catch {
      setSaveError(
        isCreate
          ? 'Nepodařilo se vytvořit píseň. Zkus to prosím znovu.'
          : 'Nepodařilo se upravit píseň. Zkus to prosím znovu.'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { savedSong, isSaving, saveError, clearSaveError: () => setSaveError(null), save };
}
