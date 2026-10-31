import { useState } from 'react';
import { generatePath, useLocation, useNavigate, useParams } from 'react-router';
import ErrorMessage from '../../components/_core/error-message/ErrorMessage';
import LoadingSpinner from '../../components/_core/loading-spinner/LoadingSpinner';
import { EMPTY_DRAFT, toDraft } from './parts/song-editor/draft';
import { SongEditor } from './parts/song-editor/SongEditor';
import type { SongDraft } from './parts/song-editor/types';
import { SongHeader } from './parts/song-header/SongHeader';
import { SongSheet } from './parts/song-sheet/SongSheet';
import { useAuth } from '../../hooks/useAuth';
import { useSongDetail } from '../../hooks/useSongDetail';
import type { Song as SongModel } from '../../lib/song';
import Routes from '../../router/Routes';
import { saveSong } from './saveSong';
import styles from './Song.module.css';

export default function Song() {
  const { songId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreate = pathname === Routes.SongCreate;
  const {
    song: loadedSong,
    songError,
    songLoading,
  } = useSongDetail(isCreate ? null : (songId ?? null));
  // The detail hook does not see saves, so the freshly saved song wins until the next load.
  const [savedSong, setSavedSong] = useState<SongModel | null>(null);
  const song = savedSong?.id === songId ? savedSong : loadedSong;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [transpose, setTranspose] = useState(0);

  const canEdit = user != null && song != null && song.ownerId === user.uid;

  const leaveEditor = () => {
    setSaveError(null);

    if (isCreate) {
      void navigate(Routes.SongLibrary);
      return;
    }

    setIsEditing(false);
  };

  const handleSubmit = async (draft: SongDraft) => {
    if (user == null) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const saved = await saveSong(draft, user.uid, isCreate ? undefined : song?.id);
      setSavedSong(saved);
      setIsEditing(false);

      if (isCreate) {
        void navigate(generatePath(Routes.Song, { songId: saved.id }), { replace: true });
      }
    } catch {
      setSaveError(
        isCreate
          ? 'Nepodařilo se vytvořit píseň. Zkus to prosím znovu.'
          : 'Nepodařilo se upravit píseň. Zkus to prosím znovu.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isCreate || (isEditing && song)) {
    return (
      <section className={styles.container}>
        <h1 className={styles.editorTitle}>{isCreate ? 'Nová píseň' : 'Upravit píseň'}</h1>
        <SongEditor
          key={song?.id ?? 'new'}
          initialDraft={song && !isCreate ? toDraft(song) : EMPTY_DRAFT}
          onSubmit={(draft) => void handleSubmit(draft)}
          onCancel={leaveEditor}
          isSaving={isSaving}
          error={saveError}
        />
      </section>
    );
  }

  if (songError) {
    return (
      <section className={styles.container}>
        <ErrorMessage message={songError} />
      </section>
    );
  }

  if (song == null) {
    return songLoading ? (
      <LoadingSpinner label="Načítám píseň…" />
    ) : (
      <section className={styles.container}>
        <ErrorMessage message="Píseň nebyla nalezena." />
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <SongHeader
        song={song}
        transpose={transpose}
        onTransposeChange={setTranspose}
        onEdit={canEdit ? () => setIsEditing(true) : undefined}
      />

      <SongSheet
        text={song.text ?? ''}
        transpose={transpose}
      />
    </section>
  );
}
