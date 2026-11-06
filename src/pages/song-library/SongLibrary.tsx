import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SongList } from '../../components/song-list/SongList';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useSongCatalog } from '../../hooks/useSongCatalog';
import ErrorMessage from '../../components/_core/error-message/ErrorMessage';
import LoadingSpinner from '../../components/_core/loading-spinner/LoadingSpinner';
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
  const { songs: allSongs, isLoading, error } = useSongCatalog();

  const songs = allSongs.filter((song) => matchesQuery(song, query));

  const renderSongs = () => {
    if (isLoading) return <LoadingSpinner label="Načítám písně…" />;
    if (error) return <ErrorMessage message={error} />;
    return <SongList songs={songs} />;
  };

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
            resultCount={isLoading ? '' : formatResultCount(songs.length, query)}
            createLabel="Vytvořit píseň"
            onCreate={() => void navigate(Routes.SongCreate)}
          />

          {renderSongs()}
        </>
      )}

      {activeTab === 'playlists' && (
        <PlaylistsTab
          mode={publicMode}
          songs={allSongs}
        />
      )}
    </section>
  );
}
