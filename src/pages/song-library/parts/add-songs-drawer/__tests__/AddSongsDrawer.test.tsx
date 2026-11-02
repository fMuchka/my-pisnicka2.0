import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Song } from '../../../../../lib/song';
import { AddSongsDrawer } from '../AddSongsDrawer';

const songs: Song[] = [
  { id: 'a', title: 'Alpha', artist: 'Kapela', ownerId: 'u1' },
  { id: 'b', title: 'Beta', artist: 'Jiná', ownerId: 'u1' },
];

const renderDrawer = (props: Partial<Parameters<typeof AddSongsDrawer>[0]> = {}) => {
  const handlers = { onAdd: vi.fn().mockResolvedValue(undefined), onClose: vi.fn() };
  render(
    <AddSongsDrawer
      playlistName="Táborák"
      songs={songs}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe('AddSongsDrawer', () => {
  it('adds the picked songs in the order they were picked, then closes', async () => {
    const user = userEvent.setup();
    const { onAdd, onClose } = renderDrawer();

    expect(screen.getByRole('button', { name: 'Přidat' })).toBeDisabled();

    await user.click(screen.getByText('Kapela – Alpha'));
    await user.click(screen.getByText('Jiná – Beta'));
    await user.click(screen.getByRole('button', { name: 'Přidat 2 písně' }));

    expect(onAdd).toHaveBeenCalledWith(['a', 'b']);
    expect(onClose).toHaveBeenCalled();
  });

  it('narrows the songs by search', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByRole('searchbox'), 'bet');

    expect(screen.getByText('Jiná – Beta')).toBeInTheDocument();
    expect(screen.queryByText('Kapela – Alpha')).not.toBeInTheDocument();
  });

  it('stays open with an error when adding fails', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer({ onAdd: vi.fn().mockRejectedValue(new Error('offline')) });

    await user.click(screen.getByText('Kapela – Alpha'));
    await user.click(screen.getByRole('button', { name: 'Přidat 1 píseň' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Písně se nepodařilo přidat do playlistu.'
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('says when every song is in the playlist already', () => {
    renderDrawer({ songs: [] });

    expect(screen.getByText('Všechny písně už v playlistu jsou.')).toBeInTheDocument();
  });
});
