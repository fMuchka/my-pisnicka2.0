import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PlaylistWithSongs } from '../../../../../hooks/usePlaylists';
import { SongPlaylistsDrawer } from '../SongPlaylistsDrawer';

const withSong: PlaylistWithSongs = {
  id: 'p1',
  name: 'Táborák',
  ownerId: 'u1',
  visibility: 'private',
  songRefs: [{ id: 'r1', sourceSongId: 's1', position: 0 }],
};
const withoutSong: PlaylistWithSongs = { ...withSong, id: 'p2', name: 'Chata', songRefs: [] };

const hook = vi.hoisted(() => ({
  playlists: [] as PlaylistWithSongs[],
  isLoading: false,
  error: null as string | null,
  create: vi.fn(),
  addSongs: vi.fn(),
  removeSong: vi.fn(),
}));

vi.mock('../../../../../hooks/usePlaylists', () => ({ usePlaylists: () => hook }));

const renderDrawer = () =>
  render(
    <SongPlaylistsDrawer
      song={{ id: 's1' }}
      onClose={vi.fn()}
    />
  );

describe('SongPlaylistsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.playlists = [withSong, withoutSong];
    hook.addSongs.mockResolvedValue(undefined);
    hook.removeSong.mockResolvedValue(undefined);
  });

  it('ticks the playlists the song is in and toggles it in and out', async () => {
    const user = userEvent.setup();
    renderDrawer();

    expect(screen.getByRole('checkbox', { name: 'Táborák' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Chata' })).not.toBeChecked();

    await user.click(screen.getByText('Chata'));
    expect(hook.addSongs).toHaveBeenCalledWith('p2', ['s1']);

    await user.click(screen.getByText('Táborák'));
    expect(hook.removeSong).toHaveBeenCalledWith('p1', 'r1');
  });

  it('creates a playlist with the song in it', async () => {
    const user = userEvent.setup();
    hook.create.mockResolvedValue({ ...withoutSong, id: 'p9' });
    renderDrawer();

    await user.type(screen.getByRole('textbox', { name: 'Název nového playlistu' }), 'Nový{Enter}');

    expect(hook.create).toHaveBeenCalledWith({ name: 'Nový', visibility: 'private' });
    expect(hook.addSongs).toHaveBeenCalledWith('p9', ['s1']);
    expect(screen.getByRole('textbox', { name: 'Název nového playlistu' })).toHaveValue('');
  });

  it('reports a failed change', async () => {
    const user = userEvent.setup();
    hook.addSongs.mockRejectedValue(new Error('offline'));
    renderDrawer();

    await user.click(screen.getByText('Chata'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Píseň se nepodařilo přidat do playlistu.'
    );
  });

  it('points to creating the first playlist when there are none', () => {
    hook.playlists = [];
    renderDrawer();

    expect(screen.getByText(/Zatím nemáš žádný playlist/)).toBeInTheDocument();
  });
});
