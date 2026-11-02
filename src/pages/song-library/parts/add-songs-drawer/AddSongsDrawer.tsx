import { ListPlus, Search } from 'lucide-react';
import { useState } from 'react';
import Button from '../../../../components/_core/button/Button';
import Checkbox from '../../../../components/_core/checkbox/Checkbox';
import Drawer from '../../../../components/_core/drawer/Drawer';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import Input from '../../../../components/_core/input/Input';
import { byArtistThenTitle } from '../../../../components/song-list/SongList';
import type { Song } from '../../../../lib/song';
import { formatSongCount, matchesQuery } from '../../filter';
import styles from './AddSongsDrawer.module.css';

type AddSongsDrawerProps = {
  playlistName: string;
  /** Songs not in the playlist yet. */
  songs: Song[];
  /** Gets the picked songs in the order they were picked, which is how they're appended. */
  onAdd: (songIds: string[]) => Promise<void>;
  onClose: () => void;
};

export function AddSongsDrawer({
  playlistName,
  songs,
  onAdd,
  onClose,
}: Readonly<AddSongsDrawerProps>) {
  const [query, setQuery] = useState('');
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleSongs = songs.filter((song) => matchesQuery(song, query)).sort(byArtistThenTitle);

  const togglePicked = (songId: string, isPicked: boolean) =>
    setPickedIds((ids) => (isPicked ? [...ids, songId] : ids.filter((id) => id !== songId)));

  const handleAdd = async () => {
    setIsAdding(true);
    setError(null);

    try {
      await onAdd(pickedIds);
      onClose();
    } catch {
      setError('Písně se nepodařilo přidat do playlistu.');
      setIsAdding(false);
    }
  };

  const emptyText =
    songs.length === 0 ? 'Všechny písně už v playlistu jsou.' : 'Žádné písně neodpovídají hledání.';

  return (
    <Drawer
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={`Přidat do playlistu ${playlistName}`}
      titleIcon={ListPlus}
    >
      <Input
        type="search"
        value={query}
        onValueChange={setQuery}
        prependIcon={Search}
        placeholder="Hledat interpreta nebo píseň…"
        aria-label="Hledat interpreta nebo píseň"
      />

      {visibleSongs.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul
          className={styles.songs}
          aria-label="Písně"
        >
          {visibleSongs.map((song) => (
            <li key={song.id}>
              <Checkbox
                label={`${song.artist} – ${song.title}`}
                checked={pickedIds.includes(song.id)}
                onCheckedChange={(isPicked) => togglePicked(song.id, isPicked)}
              />
            </li>
          ))}
        </ul>
      )}

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
          label={pickedIds.length > 0 ? `Přidat ${formatSongCount(pickedIds.length)}` : 'Přidat'}
          disabled={pickedIds.length === 0 || isAdding}
          onClick={() => void handleAdd()}
        />
      </div>
    </Drawer>
  );
}
