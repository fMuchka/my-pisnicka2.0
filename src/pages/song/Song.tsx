import { Minus, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { generatePath, useLocation, useNavigate, useParams } from 'react-router';
import Button from '../../components/_core/button/Button';
import ErrorMessage from '../../components/_core/error-message/ErrorMessage';
import LoadingSpinner from '../../components/_core/loading-spinner/LoadingSpinner';
import { EMPTY_DRAFT, toDraft } from './parts/song-editor/draft';
import { SongEditor } from './parts/song-editor/SongEditor';
import type { SongDraft } from './parts/song-editor/types';
import { SongSheet } from './parts/song-sheet/SongSheet';
import { useAuth } from '../../hooks/useAuth';
import { useSongDetail } from '../../hooks/useSongDetail';
import type { Song as SongModel } from '../../lib/song';
import Routes from '../../router/Routes';
import { saveSong } from './saveSong';
import styles from './Song.module.css';

const formatTranspose = (value: number) => (value > 0 ? `+${value}` : `${value}`);

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
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{song.title}</h1>
          <p className={styles.artist}>{song.artist}</p>
        </div>
        {canEdit && (
          <Button
            icon={Pencil}
            styleVariation="text"
            aria-label="Upravit píseň"
            onClick={() => setIsEditing(true)}
          />
        )}
      </header>

      <dl className={styles.meta}>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>Capo</dt>
          <dd className={styles.metaValue}>{song.capo ?? '—'}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>Tónina</dt>
          <dd className={styles.metaValue}>{song.originalKey?.trim() || '—'}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>Transpozice</dt>
          <dd className={styles.metaValue}>
            <button
              type="button"
              className={styles.stepper}
              aria-label="Transponovat o půltón dolů"
              onClick={() => setTranspose((value) => value - 1)}
            >
              <Minus aria-hidden="true" />
            </button>
            <output aria-live="polite">{formatTranspose(transpose)}</output>
            <button
              type="button"
              className={styles.stepper}
              aria-label="Transponovat o půltón nahoru"
              onClick={() => setTranspose((value) => value + 1)}
            >
              <Plus aria-hidden="true" />
            </button>
          </dd>
        </div>
      </dl>

      <SongSheet
        text={song.text ?? ''}
        transpose={transpose}
      />
    </section>
  );
}
