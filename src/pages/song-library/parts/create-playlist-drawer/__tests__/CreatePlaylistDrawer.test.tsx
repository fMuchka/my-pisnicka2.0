import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePlaylistDrawer } from '../CreatePlaylistDrawer';

const renderDrawer = (onCreate = vi.fn().mockResolvedValue(undefined)) => {
  const onClose = vi.fn();
  render(
    <CreatePlaylistDrawer
      onCreate={onCreate}
      onClose={onClose}
    />
  );
  return { onCreate, onClose };
};

describe('CreatePlaylistDrawer', () => {
  it('creates a private playlist with the trimmed name, then closes', async () => {
    const user = userEvent.setup();
    const { onCreate, onClose } = renderDrawer();

    expect(screen.getByRole('button', { name: 'Vytvořit' })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: /Název playlistu/ }), '  Táborák {Enter}');

    expect(onCreate).toHaveBeenCalledWith('Táborák', 'private');
    expect(onClose).toHaveBeenCalled();
  });

  it('can make the playlist public', async () => {
    const user = userEvent.setup();
    const { onCreate } = renderDrawer();

    await user.type(screen.getByRole('textbox', { name: /Název playlistu/ }), 'Táborák');
    await user.click(screen.getByRole('switch', { name: /Veřejný playlist/ }));
    await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

    expect(onCreate).toHaveBeenCalledWith('Táborák', 'public');
  });

  it('stays open with an error when creating fails', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer(vi.fn().mockRejectedValue(new Error('offline')));

    await user.type(screen.getByRole('textbox', { name: /Název playlistu/ }), 'Táborák{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Playlist se nepodařilo vytvořit.');
    expect(onClose).not.toHaveBeenCalled();
  });
});
