import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import ErrorMessage from '../../components/_core/error-message/ErrorMessage';
import LoadingSpinner from '../../components/_core/loading-spinner/LoadingSpinner';
import type { SongDraft } from './parts/song-editor/types';
import { SongEditorView } from './parts/song-editor-view/SongEditorView';
import { SongPlaylistsDrawer } from './parts/song-playlists-drawer/SongPlaylistsDrawer';
import { SongView } from './parts/song-view/SongView';
import { useAuth } from '../../hooks/useAuth';
import { useSongDetail } from '../../hooks/useSongDetail';
import Routes from '../../router/Routes';
import { useSongSave } from './useSongSave';
import styles from './Song.module.css';

export default function Song() {
  const { songId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const isCreate = pathname === Routes.SongCreate;
  const {
    song: loadedSong,
    songError,
    songLoading,
  } = useSongDetail(isCreate ? null : (songId ?? null));
  const { savedSong, isSaving, saveError, clearSaveError, save } = useSongSave(isCreate);
  const song = savedSong?.id === songId ? savedSong : loadedSong;

  const [isEditing, setIsEditing] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [isPlaylistsOpen, setIsPlaylistsOpen] = useState(false);

  const canEdit = song?.ownerId === user?.uid;

  const leaveEditor = () => {
    clearSaveError();

    if (isCreate) {
      void navigate(Routes.SongLibrary);
      return;
    }

    setIsEditing(false);
  };

  const handleSubmit = async (draft: SongDraft) => {
    if (await save(draft, song?.id)) setIsEditing(false);
  };

  if (isCreate || (isEditing && song)) {
    return (
      <section className={styles.container}>
        <SongEditorView
          song={isCreate ? null : song}
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
      <SongView
        song={song}
        transpose={transpose}
        onTransposeChange={setTranspose}
        onEdit={canEdit ? () => setIsEditing(true) : undefined}
        onManagePlaylists={user != null && !isGuest ? () => setIsPlaylistsOpen(true) : undefined}
      />

      {isPlaylistsOpen && (
        <SongPlaylistsDrawer
          song={song}
          onClose={() => setIsPlaylistsOpen(false)}
        />
      )}
    </section>
  );
}
