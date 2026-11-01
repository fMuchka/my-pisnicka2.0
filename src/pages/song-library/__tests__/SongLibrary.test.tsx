import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SongLibrary from '../SongLibrary';
import Routes from '../../../router/Routes';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../../hooks/useSongListData', () => ({
  useSongListData: () => ({ userSongs: [] }),
}));

vi.mock('../../../components/song-list/SongList', () => ({
  SongList: () => null,
}));

describe('SongLibrary', () => {
  it('opens the song form to create a new song', async () => {
    const user = userEvent.setup();
    render(<SongLibrary />);

    await user.click(screen.getByRole('button', { name: 'Vytvořit píseň' }));

    expect(mocks.navigate).toHaveBeenCalledWith(Routes.SongCreate);
  });
});
