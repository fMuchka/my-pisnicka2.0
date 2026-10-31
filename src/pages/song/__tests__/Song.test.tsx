import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes as RouterRoutes, useLocation } from 'react-router';
import type { Song as SongModel } from '../../../lib/song';
import { usePageNavigationState } from '../../../hooks/usePageNavigation';
import Routes from '../../../router/Routes';
import Song from '../Song';

const song: SongModel = {
  id: 's1',
  title: 'Kometa',
  artist: 'Jaromír Nohavica',
  text: '[verse]\n[C]Za sklem výlohy',
  capo: 2,
  ownerId: 'owner',
};

const detail = vi.hoisted(() => ({
  song: null as SongModel | null,
  songError: null as string | null,
  songLoading: false,
}));
const auth = vi.hoisted(() => ({ user: { uid: 'owner' } as { uid: string } | null }));
const save = vi.hoisted(() => ({ saveSong: vi.fn() }));

vi.mock('../../../hooks/useSongDetail', () => ({ useSongDetail: () => ({ ...detail }) }));
vi.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ ...auth }) }));
vi.mock('../saveSong', () => save);

function LocationDisplay() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

const renderSong = (path = '/song/s1') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <RouterRoutes>
        <Route
          path={Routes.SongCreate}
          element={<Song />}
        />
        <Route
          path={Routes.Song}
          element={<Song />}
        />
        <Route
          path="*"
          element={null}
        />
      </RouterRoutes>
      <LocationDisplay />
    </MemoryRouter>
  );

describe('Song page', () => {
  beforeEach(() => {
    detail.song = song;
    detail.songError = null;
    detail.songLoading = false;
    auth.user = { uid: 'owner' };
    save.saveSong.mockReset();
  });

  it('shows the song header, meta and sheet', () => {
    renderSong();

    expect(screen.getByRole('heading', { level: 1, name: 'Kometa' })).toBeInTheDocument();
    expect(screen.getByText('Jaromír Nohavica')).toBeInTheDocument();
    expect(screen.getByText('Capo').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Tónina').nextElementSibling).toHaveTextContent('—');
    expect(screen.getByRole('heading', { name: 'Sloka' })).toBeInTheDocument();
  });

  it('transposes the chords with the steppers', async () => {
    const user = userEvent.setup();
    renderSong();

    await user.click(screen.getByRole('button', { name: 'Transponovat o půltón nahoru' }));
    await user.click(screen.getByRole('button', { name: 'Transponovat o půltón nahoru' }));

    expect(screen.getByRole('status')).toHaveTextContent('+2');
    const verse = screen.getByRole('heading', { name: 'Sloka' }).closest('section') as HTMLElement;
    expect(within(verse).getByText('D')).toHaveClass('chord');
    expect(screen.getByRole('button', { name: /akordy/i })).toHaveTextContent('D');

    await user.click(screen.getByRole('button', { name: 'Transponovat o půltón dolů' }));
    expect(screen.getByRole('status')).toHaveTextContent('+1');
  });

  it('swaps the header for the play controls and hides the navigation while playing', async () => {
    const user = userEvent.setup();
    renderSong();

    await user.click(screen.getByRole('button', { name: 'Přehrát píseň' }));

    expect(screen.getByRole('toolbar', { name: 'Přehrávání' })).toHaveTextContent('Kometa');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(usePageNavigationState.getState().fadeAway).toBe(true);
    expect(screen.getByRole('heading', { name: 'Sloka' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ukončit přehrávání' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Kometa' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(usePageNavigationState.getState().fadeAway).toBe(false);
  });

  it('brings the navigation back when the page is left while playing', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSong();

    await user.click(screen.getByRole('button', { name: 'Přehrát píseň' }));
    unmount();

    expect(usePageNavigationState.getState().fadeAway).toBeUndefined();
  });

  it('shows a spinner while loading and the error when loading fails', () => {
    detail.song = null;
    detail.songLoading = true;
    const { unmount } = renderSong();
    expect(screen.getByText('Načítám píseň…')).toBeInTheDocument();
    unmount();

    detail.songLoading = false;
    detail.songError = 'Chyba při načítání písně.';
    renderSong();
    expect(screen.getByRole('alert')).toHaveTextContent('Chyba při načítání písně.');
  });

  it('says when the song does not exist', () => {
    detail.song = null;
    renderSong();

    expect(screen.getByRole('alert')).toHaveTextContent('Píseň nebyla nalezena.');
  });

  it('offers editing only to the song owner', () => {
    auth.user = { uid: 'someone-else' };
    const { unmount } = renderSong();
    expect(screen.queryByRole('button', { name: 'Upravit píseň' })).not.toBeInTheDocument();
    unmount();

    auth.user = null;
    renderSong();
    expect(screen.queryByRole('button', { name: 'Upravit píseň' })).not.toBeInTheDocument();
  });

  it('edits and saves the song, then shows the saved version', async () => {
    const user = userEvent.setup();
    save.saveSong.mockResolvedValue({ ...song, title: 'Kometa 2' });
    renderSong();

    await user.click(screen.getByRole('button', { name: 'Upravit píseň' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Upravit píseň' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /název/i }), ' 2');
    await user.click(screen.getByRole('button', { name: 'Uložit' }));

    expect(save.saveSong).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Kometa 2', capo: '2' }),
      'owner',
      's1'
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Kometa 2' })).toBeInTheDocument();
  });

  it('keeps the editor open with an error when saving fails', async () => {
    const user = userEvent.setup();
    save.saveSong.mockRejectedValue(new Error('offline'));
    renderSong();

    await user.click(screen.getByRole('button', { name: 'Upravit píseň' }));
    await user.click(screen.getByRole('button', { name: 'Uložit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nepodařilo se upravit píseň.');
    expect(screen.getByRole('button', { name: 'Uložit' })).toBeEnabled();
  });

  it('cancels editing back to the song', async () => {
    const user = userEvent.setup();
    renderSong();

    await user.click(screen.getByRole('button', { name: 'Upravit píseň' }));
    await user.click(screen.getByRole('button', { name: 'Zrušit' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Kometa' })).toBeInTheDocument();
    expect(save.saveSong).not.toHaveBeenCalled();
  });

  it('creates a new song and opens it', async () => {
    const user = userEvent.setup();
    detail.song = null;
    save.saveSong.mockResolvedValue({ ...song, id: 'new-id' });
    renderSong(Routes.SongCreate);

    expect(screen.getByRole('heading', { level: 1, name: 'Nová píseň' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /název/i }), 'Kometa');
    await user.type(screen.getByRole('textbox', { name: /interpret/i }), 'Nohavica');
    await user.click(screen.getByRole('button', { name: 'Uložit' }));

    expect(save.saveSong).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Kometa' }),
      'owner',
      undefined
    );
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/song/new-id'));
  });

  it('goes back to the library when creating is cancelled', async () => {
    const user = userEvent.setup();
    renderSong(Routes.SongCreate);

    await user.click(screen.getByRole('button', { name: 'Zrušit' }));

    expect(screen.getByTestId('location')).toHaveTextContent(Routes.SongLibrary);
  });
});
