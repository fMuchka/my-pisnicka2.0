import { useCallback, useRef, useState } from 'react';
import { generatePath, useLocation, useNavigate, useParams } from 'react-router';
import ErrorMessage from '../../components/_core/error-message/ErrorMessage';
import LoadingSpinner from '../../components/_core/loading-spinner/LoadingSpinner';
import { EMPTY_DRAFT, toDraft } from './parts/song-editor/draft';
import { SongEditor } from './parts/song-editor/SongEditor';
import type { SongDraft } from './parts/song-editor/types';
import { PlayControls } from './parts/play-controls/PlayControls';
import { useAutoScroll } from './parts/play-controls/useAutoScroll';
import { SongHeader } from './parts/song-header/SongHeader';
import { SongSheet } from '../../components/song-sheet';
import { useAuth } from '../../hooks/useAuth';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useSongDetail } from '../../hooks/useSongDetail';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useFeaturePreferences } from '../../stores/featurePreferences';
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [transpose, setTranspose] = useState(0);

  usePageNavigation({ fadeAway: isPlaying });
  const stopPlaying = useCallback(() => setIsPlaying(false), []);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tapToToggleScroll = useFeaturePreferences((s) => s.tapToToggleScroll);
  const keepScreenAwake = useFeaturePreferences((s) => s.keepScreenAwake);
  const allowManualScroll = useFeaturePreferences((s) => s.allowManualScroll);
  const autoScroll = useAutoScroll(isPlaying, sheetRef, { allowManualScroll });
  useWakeLock(isPlaying && keepScreenAwake);

  const canEdit = song?.ownerId === user?.uid;

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
      {isPlaying ? (
        <PlayControls
          isScrolling={autoScroll.isScrolling}
          secondsLeft={autoScroll.secondsLeft}
          canSpeedUp={autoScroll.canSpeedUp}
          canSlowDown={autoScroll.canSlowDown}
          onToggleScrolling={autoScroll.toggleScrolling}
          onSpeedUp={autoScroll.speedUp}
          onSlowDown={autoScroll.slowDown}
          onJump={autoScroll.jump}
          onExit={stopPlaying}
        />
      ) : (
        <SongHeader
          song={song}
          transpose={transpose}
          onTransposeChange={setTranspose}
          onEdit={canEdit ? () => setIsEditing(true) : undefined}
          onStartPlay={() => setIsPlaying(true)}
        />
      )}

      {/* In play mode a tap anywhere on the text can pause or resume; the play button covers keyboard users. */}
      <div
        ref={sheetRef}
        onClick={isPlaying && tapToToggleScroll ? autoScroll.toggleScrolling : undefined}
      >
        <SongSheet
          text={song.text ?? ''}
          transpose={transpose}
        />
      </div>
    </section>
  );
}
