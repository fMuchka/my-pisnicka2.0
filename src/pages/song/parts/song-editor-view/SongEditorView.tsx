import LoadingSpinner from '../../../../components/_core/loading-spinner/LoadingSpinner';
import { useTheme } from '../../../../hooks/useTheme';
import type { Song } from '../../../../lib/song';
import { useSongTags } from '../../useSongTags';
import { emptyDraft, toDraft } from '../song-editor/draft';
import { SongEditor } from '../song-editor/SongEditor';
import type { SongDraft } from '../song-editor/types';
import styles from './SongEditorView.module.css';

type SongEditorViewProps = {
  /** The song to edit; null for a new one. */
  song: Song | null;
  onSubmit: (draft: SongDraft) => void;
  onCancel: () => void;
  isSaving: boolean;
  error: string | null;
};

/** The editor with its heading: a new song starts empty, an existing one once its tags are loaded. */
export function SongEditorView({
  song,
  onSubmit,
  onCancel,
  isSaving,
  error,
}: Readonly<SongEditorViewProps>) {
  const preferredInstrument = useTheme((state) => state.preferredInstrument);
  const songTags = useSongTags(song?.id ?? null);

  if (songTags.isLoading) return <LoadingSpinner label="Načítám štítky…" />;

  return (
    <>
      <h1 className={styles.title}>{song ? 'Upravit píseň' : 'Nová píseň'}</h1>
      <SongEditor
        key={song?.id ?? 'new'}
        initialDraft={song ? toDraft(song, songTags.tags) : emptyDraft(preferredInstrument)}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
}
