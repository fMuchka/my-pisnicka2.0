import { Music } from 'lucide-react';
import { generatePath, Link } from 'react-router';
import type { Song } from '../../lib/song';
import Routes from '../../router/Routes';
import styles from './SongList.module.css';

type SongListItem = Pick<Song, 'id' | 'artist' | 'title'>;

type SongListProps = {
  songs: SongListItem[];
  emptyText?: string;
};

type ArtistGroup = {
  artist: string;
  songs: SongListItem[];
};

export const byArtistThenTitle = (a: SongListItem, b: SongListItem) =>
  a.artist.localeCompare(b.artist, 'cs', { sensitivity: 'base' }) ||
  a.title.localeCompare(b.title, 'cs', { sensitivity: 'base' });

const groupByArtist = (songs: SongListItem[]): ArtistGroup[] => {
  const groups: ArtistGroup[] = [];

  for (const song of songs.toSorted(byArtistThenTitle)) {
    const last = groups.at(-1);

    if (last?.artist === song.artist) {
      last.songs.push(song);
    } else {
      groups.push({ artist: song.artist, songs: [song] });
    }
  }

  return groups;
};

/** Songs sorted and grouped under artist headings, each linking to its detail page. */
export function SongList({
  songs,
  emptyText = 'Žádné písně neodpovídají hledání.',
}: Readonly<SongListProps>) {
  if (songs.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <div className={styles.songList}>
      {groupByArtist(songs).map((group) => (
        <section
          key={group.artist}
          className={styles.artistGroup}
        >
          <h2 className={styles.artistHeading}>{group.artist}</h2>
          <ul className={styles.songs}>
            {group.songs.map((song) => (
              <li key={song.id}>
                <Link
                  to={generatePath(Routes.Song, { songId: song.id })}
                  className={styles.songRow}
                >
                  <Music
                    className={styles.songIcon}
                    aria-hidden="true"
                  />
                  <span className={styles.songTitle}>{song.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
