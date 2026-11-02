import { ListPlus, Plus } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import Button from '../../../../components/_core/button/Button';
import Checkbox from '../../../../components/_core/checkbox/Checkbox';
import Drawer from '../../../../components/_core/drawer/Drawer';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import Input from '../../../../components/_core/input/Input';
import LoadingSpinner from '../../../../components/_core/loading-spinner/LoadingSpinner';
import { usePlaylists, type PlaylistWithSongs } from '../../../../hooks/usePlaylists';
import type { Song } from '../../../../lib/song';
import styles from './SongPlaylistsDrawer.module.css';

type SongPlaylistsDrawerProps = {
  song: Pick<Song, 'id'>;
  onClose: () => void;
};

/** The user's playlists, ticked where the song is in them; each tick adds or removes it right away. */
export function SongPlaylistsDrawer({ song, onClose }: Readonly<SongPlaylistsDrawerProps>) {
  const { playlists, isLoading, error, create, addSongs, removeSong } = usePlaylists('mine');

  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const songRefIn = (playlist: PlaylistWithSongs) =>
    playlist.songRefs.find((songRef) => songRef.sourceSongId === song.id);

  const toggle = async (playlist: PlaylistWithSongs, isIn: boolean) => {
    setPendingIds((ids) => [...ids, playlist.id]);
    setActionError(null);

    try {
      const songRef = songRefIn(playlist);

      if (isIn) {
        await addSongs(playlist.id, [song.id]);
      } else if (songRef) {
        await removeSong(playlist.id, songRef.id);
      }
    } catch {
      setActionError(
        isIn
          ? 'Píseň se nepodařilo přidat do playlistu.'
          : 'Píseň se nepodařilo odebrat z playlistu.'
      );
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== playlist.id));
    }
  };

  const handleCreate = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name || isCreating) return;

    setIsCreating(true);
    setActionError(null);

    try {
      const playlist = await create({ name, visibility: 'private' });
      await addSongs(playlist.id, [song.id]);
      setNewName('');
    } catch {
      setActionError('Playlist se nepodařilo vytvořit.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderPlaylists = () => {
    if (isLoading) return <LoadingSpinner label="Načítám playlisty…" />;
    if (error) return <ErrorMessage message={error} />;
    if (playlists.length === 0) {
      return <p className={styles.empty}>Zatím nemáš žádný playlist. Založ si první níže.</p>;
    }

    return (
      <ul
        className={styles.playlists}
        aria-label="Playlisty"
      >
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            <Checkbox
              label={playlist.name}
              checked={songRefIn(playlist) !== undefined}
              disabled={pendingIds.includes(playlist.id)}
              onCheckedChange={(isIn) => void toggle(playlist, isIn)}
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Drawer
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title="Přidat do playlistu"
      titleIcon={ListPlus}
    >
      {renderPlaylists()}

      {actionError && <ErrorMessage message={actionError} />}

      <form
        className={styles.createForm}
        onSubmit={(event) => void handleCreate(event)}
      >
        <Input
          aria-label="Název nového playlistu"
          placeholder="Nový playlist…"
          value={newName}
          onValueChange={setNewName}
          maxLength={120}
        />
        <Button
          type="submit"
          icon={Plus}
          aria-label="Vytvořit playlist a přidat píseň"
          disabled={!newName.trim() || isCreating}
        />
      </form>
    </Drawer>
  );
}
