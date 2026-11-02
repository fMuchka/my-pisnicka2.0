import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { Song } from '../../../../../lib/song';
import type { PlaylistWithSongs } from '../../../usePlaylists';
import { PlaylistList } from '../PlaylistList';

const songs: Song[] = [
  { id: 'a', title: 'Alpha', artist: 'Kapela', ownerId: 'u1' },
  { id: 'b', title: 'Beta', artist: 'Jiná', ownerId: 'u1' },
];

const playlist: PlaylistWithSongs = {
  id: 'p1',
  name: 'Táborák',
  ownerId: 'u1',
  visibility: 'public',
  songRefs: [
    { id: 'r2', sourceSongId: 'b', position: 0 },
    { id: 'r1', sourceSongId: 'a', position: 1 },
    { id: 'r3', sourceSongId: 'deleted', position: 2 },
  ],
};

const renderList = (props: Partial<Parameters<typeof PlaylistList>[0]> = {}) => {
  const handlers = { onAddSongs: vi.fn(), onRemoveSong: vi.fn() };
  render(
    <MemoryRouter>
      <PlaylistList
        playlists={[playlist]}
        songById={new Map(songs.map((song) => [song.id, song]))}
        canEdit={() => true}
        showVisibility
        emptyText="Nic tu není."
        {...handlers}
        {...props}
      />
    </MemoryRouter>
  );
  return handlers;
};

describe('PlaylistList', () => {
  it('lists the playlist’s songs in playlist order, leaving out missing ones', async () => {
    const user = userEvent.setup();
    renderList();

    expect(screen.getByText('2 písně')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Veřejný' })).toBeInTheDocument();

    await user.click(screen.getByText('Táborák'));

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['BetaJiná', 'AlphaKapela']);
    expect(links[0]).toHaveAttribute('href', '/song/b');
  });

  it('lets the owner add and remove songs', async () => {
    const user = userEvent.setup();
    const { onAddSongs, onRemoveSong } = renderList();
    await user.click(screen.getByText('Táborák'));

    await user.click(screen.getByRole('button', { name: 'Odebrat Alpha z playlistu' }));
    expect(onRemoveSong).toHaveBeenCalledWith(playlist, playlist.songRefs[1]);

    await user.click(screen.getByRole('button', { name: 'Přidat písně' }));
    expect(onAddSongs).toHaveBeenCalledWith(playlist);
  });

  it('only shows someone else’s playlist', async () => {
    const user = userEvent.setup();
    renderList({ canEdit: () => false, showVisibility: false });
    await user.click(screen.getByText('Táborák'));

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Odebrat/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Přidat písně' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Veřejný' })).not.toBeInTheDocument();
  });

  it('says when there is nothing to show', () => {
    renderList({ playlists: [] });

    expect(screen.getByText('Nic tu není.')).toBeInTheDocument();
  });
});
