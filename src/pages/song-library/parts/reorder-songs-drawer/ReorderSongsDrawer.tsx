import { ArrowDown, ArrowDownAZ, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import Button from '../../../../components/_core/button/Button';
import Drawer from '../../../../components/_core/drawer/Drawer';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import { byArtistThenTitle } from '../../../../components/song-list/SongList';
import type { PlaylistEntry } from '../../playlistEntries';
import styles from './ReorderSongsDrawer.module.css';

type ReorderSongsDrawerProps = {
  playlistName: string;
  entries: PlaylistEntry[];
  /** Gets the song ref ids in their new order. */
  onSave: (orderedSongRefIds: string[]) => Promise<void>;
  onClose: () => void;
};

const moveItem = <T,>(items: T[], from: number, to: number) => {
  const next = [...items];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

/** Moves songs up and down, or sorts them by artist and title, and saves the order at once. */
export function ReorderSongsDrawer({
  playlistName,
  entries,
  onSave,
  onClose,
}: Readonly<ReorderSongsDrawerProps>) {
  const [order, setOrder] = useState(entries);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnchanged = order.every((entry, index) => entry === entries[index]);

  const sortAlphabetically = () =>
    setOrder((current) => current.toSorted((a, b) => byArtistThenTitle(a.song, b.song)));

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave(order.map((entry) => entry.songRef.id));
      onClose();
    } catch {
      setError('Pořadí se nepodařilo uložit.');
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={`Pořadí v playlistu ${playlistName}`}
      titleIcon={ArrowUpDown}
    >
      <Button
        type="button"
        icon={ArrowDownAZ}
        label="Seřadit podle interpreta a názvu"
        colorVariation="secondary"
        styleVariation="outlined"
        className={styles.sortButton}
        onClick={sortAlphabetically}
      />

      <ol
        className={styles.songs}
        aria-label="Písně"
      >
        {order.map((entry, index) => (
          <li
            key={entry.songRef.id}
            className={styles.song}
          >
            <span
              className={styles.position}
              aria-hidden="true"
            >
              {index + 1}.
            </span>
            <span className={styles.songText}>
              <span className={styles.songTitle}>{entry.song.title}</span>
              <span className={styles.songArtist}>{entry.song.artist}</span>
            </span>
            <button
              type="button"
              className={styles.moveButton}
              aria-label={`Posunout ${entry.song.title} výš`}
              disabled={index === 0}
              onClick={() => setOrder((current) => moveItem(current, index, index - 1))}
            >
              <ArrowUp aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.moveButton}
              aria-label={`Posunout ${entry.song.title} níž`}
              disabled={index === order.length - 1}
              onClick={() => setOrder((current) => moveItem(current, index, index + 1))}
            >
              <ArrowDown aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>

      {error && <ErrorMessage message={error} />}

      <div className={styles.actions}>
        <Button
          type="button"
          label="Zrušit"
          colorVariation="secondary"
          styleVariation="outlined"
          onClick={onClose}
        />
        <Button
          type="button"
          label={isSaving ? 'Ukládám…' : 'Uložit pořadí'}
          disabled={isUnchanged || isSaving}
          onClick={() => void handleSave()}
        />
      </div>
    </Drawer>
  );
}
