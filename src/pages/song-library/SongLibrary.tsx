import { Search } from 'lucide-react';
import { useState } from 'react';
import Input from '../../components/_core/input/Input';
import { SongList } from '../../components/song-list/SongList';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useSongListData } from '../../hooks/useSongListData';
import { formatResultCount, matchesQuery } from './filter';
import type { PublicMode, SongLibraryTab } from './types';
import styles from './SongLibrary.module.css';
import SegmentGroup from '../../components/_core/segment-group/SegmentGroup';
import { publicModeOptions, tabOptions } from './constants';

export default function SongLibrary() {
  usePageNavigation({ pageTitle: 'Knihovna' });

  const [publicMode, setPublicMode] = useState<PublicMode>('private');
  const [activeTab, setActiveTab] = useState<SongLibraryTab>('songs');
  const [query, setQuery] = useState('');
  const { userSongs } = useSongListData();

  const songs = userSongs.filter((song) => matchesQuery(song, query));

  return (
    <section className={styles.container}>
      <SegmentGroup
        aria-label="Zdroj"
        options={publicModeOptions}
        value={publicMode}
        onValueChange={(val) => setPublicMode(val as PublicMode)}
      />
      <SegmentGroup
        aria-label="Zobrazit"
        options={tabOptions}
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as SongLibraryTab)}
      />

      {activeTab === 'songs' && (
        <>
          <Input
            type="search"
            value={query}
            onValueChange={setQuery}
            prependIcon={Search}
            placeholder="Hledat interpreta nebo píseň…"
            aria-label="Hledat interpreta nebo píseň"
          />

          <p
            className={styles.resultCount}
            aria-live="polite"
          >
            {formatResultCount(songs.length, query)}
          </p>

          <SongList songs={songs} />
        </>
      )}

      {/* TODO: Render the playlist list for activeTab === 'playlists' once it is ported. */}
    </section>
  );
}
