import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SongList } from '../../components/song-list/SongList';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useSongListData } from '../../hooks/useSongListData';
import { formatResultCount, matchesQuery } from './filter';
import type { PublicMode, SongLibraryTab } from './types';
import styles from './SongLibrary.module.css';
import SegmentGroup from '../../components/_core/segment-group/SegmentGroup';
import { publicModeOptions, tabOptions } from './constants';
import Routes from '../../router/Routes';
import { LibraryToolbar } from './parts/library-toolbar/LibraryToolbar';
import { PlaylistsTab } from './parts/playlists-tab/PlaylistsTab';

export default function SongLibrary() {
  usePageNavigation({ pageTitle: 'Knihovna' });
  const navigate = useNavigate();

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
          <LibraryToolbar
            query={query}
            onQueryChange={setQuery}
            searchLabel="Hledat interpreta nebo píseň"
            resultCount={formatResultCount(songs.length, query)}
            createLabel="Vytvořit píseň"
            onCreate={() => void navigate(Routes.SongCreate)}
          />

          <SongList songs={songs} />
        </>
      )}

      {activeTab === 'playlists' && (
        <PlaylistsTab
          mode={publicMode}
          songs={userSongs}
        />
      )}
    </section>
  );
}
