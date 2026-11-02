import { ArrowUpDown, ChevronDown, Globe, ListMusic, Plus, Settings2, X } from 'lucide-react';
import { generatePath, Link } from 'react-router';
import Button from '../../../../components/_core/button/Button';
import type { PlaylistWithSongs } from '../../../../hooks/usePlaylists';
import type { PlaylistSongRef } from '../../../../lib/playlist';
import type { Song } from '../../../../lib/song';
import Routes from '../../../../router/Routes';
import { formatSongCount } from '../../filter';
import { playlistEntries } from '../../playlistEntries';
import styles from './PlaylistList.module.css';

export type PlaylistAction = 'add-songs' | 'reorder' | 'edit';

type PlaylistListProps = {
  playlists: PlaylistWithSongs[];
  songById: ReadonlyMap<string, Song>;
  canEdit: (playlist: PlaylistWithSongs) => boolean;
  /** Marks public playlists; pointless where every playlist is public. */
  showVisibility: boolean;
  emptyText: string;
  onAction: (playlist: PlaylistWithSongs, action: PlaylistAction) => void;
  onRemoveSong: (playlist: PlaylistWithSongs, songRef: PlaylistSongRef) => void;
};

/** Playlists that open in place to show their songs in playlist order. */
export function PlaylistList({
  playlists,
  songById,
  canEdit,
  showVisibility,
  emptyText,
  onAction,
  onRemoveSong,
}: Readonly<PlaylistListProps>) {
  if (playlists.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <ul className={styles.playlists}>
      {playlists.map((playlist) => {
        const entries = playlistEntries(playlist, songById);
        const isEditable = canEdit(playlist);

        return (
          <li key={playlist.id}>
            <details className={styles.playlist}>
              <summary className={styles.summary}>
                <ListMusic
                  className={styles.playlistIcon}
                  aria-hidden="true"
                />
                <span className={styles.name}>{playlist.name}</span>
                {showVisibility && playlist.visibility === 'public' && (
                  <Globe
                    className={styles.publicIcon}
                    aria-label="Veřejný"
                    role="img"
                  />
                )}
                <span className={styles.count}>{formatSongCount(entries.length)}</span>
                <ChevronDown
                  className={styles.chevron}
                  aria-hidden="true"
                />
              </summary>

              <div className={styles.body}>
                {entries.length === 0 ? (
                  <p className={styles.empty}>Playlist je zatím prázdný.</p>
                ) : (
                  <ol className={styles.songs}>
                    {entries.map(({ songRef, song }) => (
                      <li
                        key={songRef.id}
                        className={styles.songItem}
                      >
                        <Link
                          to={generatePath(Routes.Song, { songId: song.id })}
                          className={styles.songRow}
                        >
                          <span className={styles.songTitle}>{song.title}</span>
                          <span className={styles.songArtist}>{song.artist}</span>
                        </Link>
                        {isEditable && (
                          <button
                            type="button"
                            className={styles.removeButton}
                            aria-label={`Odebrat ${song.title} z playlistu`}
                            onClick={() => onRemoveSong(playlist, songRef)}
                          >
                            <X aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {isEditable && (
                  <div className={styles.actions}>
                    <Button
                      type="button"
                      icon={Plus}
                      label="Přidat písně"
                      styleVariation="text"
                      className={styles.actionButton}
                      onClick={() => onAction(playlist, 'add-songs')}
                    />
                    <Button
                      type="button"
                      icon={ArrowUpDown}
                      label="Pořadí"
                      styleVariation="text"
                      className={styles.actionButton}
                      disabled={entries.length < 2}
                      onClick={() => onAction(playlist, 'reorder')}
                    />
                    <Button
                      type="button"
                      icon={Settings2}
                      label="Upravit"
                      styleVariation="text"
                      className={styles.actionButton}
                      onClick={() => onAction(playlist, 'edit')}
                    />
                  </div>
                )}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
