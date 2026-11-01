import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/_core/button/Button';
import Input from '../../components/_core/input/Input';
import { SongList } from '../../components/song-list/SongList';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useSongListData } from '../../hooks/useSongListData';
import { formatResultCount, matchesQuery } from './filter';
import type { PublicMode, SongLibraryTab } from './types';
import styles from './SongLibrary.module.css';
import SegmentGroup from '../../components/_core/segment-group/SegmentGroup';
import { publicModeOptions, tabOptions } from './constants';
import Routes from '../../router/Routes';

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
          <Input
            type="search"
            value={query}
            onValueChange={setQuery}
            prependIcon={Search}
            placeholder="Hledat interpreta nebo píseň…"
            aria-label="Hledat interpreta nebo píseň"
          />

          <div className={styles.listHeader}>
            <p
              className={styles.resultCount}
              aria-live="polite"
            >
              {formatResultCount(songs.length, query)}
            </p>
            <Button
              icon={Plus}
              label="Vytvořit píseň"
              onClick={() => void navigate(Routes.SongCreate)}
            />
          </div>

          <SongList songs={songs} />
        </>
      )}

      {/* TODO: Render the playlist list for activeTab === 'playlists' once it is ported. */}
    </section>
  );
}
