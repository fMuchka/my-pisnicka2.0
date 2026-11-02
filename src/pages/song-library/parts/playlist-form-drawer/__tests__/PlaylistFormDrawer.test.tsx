import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaylistFormDrawer } from '../PlaylistFormDrawer';

const renderDrawer = (props: Partial<Parameters<typeof PlaylistFormDrawer>[0]> = {}) => {
  const handlers = { onSubmit: vi.fn().mockResolvedValue(undefined), onClose: vi.fn() };
  render(
    <PlaylistFormDrawer
      {...handlers}
      {...props}
    />
  );
  return { ...handlers, ...props };
};

const nameField = () => screen.getByRole('textbox', { name: /Název playlistu/ });

describe('PlaylistFormDrawer', () => {
  describe('creating', () => {
    it('creates a private playlist with the trimmed name, then closes', async () => {
      const user = userEvent.setup();
      const { onSubmit, onClose } = renderDrawer();

      expect(screen.getByRole('button', { name: 'Vytvořit' })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Smazat/ })).not.toBeInTheDocument();

      await user.type(nameField(), '  Táborák {Enter}');

      expect(onSubmit).toHaveBeenCalledWith({ name: 'Táborák', visibility: 'private' });
      expect(onClose).toHaveBeenCalled();
    });

    it('can make the playlist public', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderDrawer();

      await user.type(nameField(), 'Táborák');
      await user.click(screen.getByRole('switch', { name: /Veřejný playlist/ }));
      await user.click(screen.getByRole('button', { name: 'Vytvořit' }));

      expect(onSubmit).toHaveBeenCalledWith({ name: 'Táborák', visibility: 'public' });
    });

    it('stays open with an error when creating fails', async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer({ onSubmit: vi.fn().mockRejectedValue(new Error('x')) });

      await user.type(nameField(), 'Táborák{Enter}');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Playlist se nepodařilo vytvořit.'
      );
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('editing', () => {
    const playlist = { name: 'Táborák', visibility: 'public' as const };

    it('saves a new name and visibility once something changed', async () => {
      const user = userEvent.setup();
      const { onSubmit, onClose } = renderDrawer({ playlist });

      expect(nameField()).toHaveValue('Táborák');
      expect(screen.getByRole('switch', { name: /Veřejný playlist/ })).toBeChecked();
      expect(screen.getByRole('button', { name: 'Uložit' })).toBeDisabled();

      await user.clear(nameField());
      await user.type(nameField(), 'Chata');
      await user.click(screen.getByRole('switch', { name: /Veřejný playlist/ }));
      await user.click(screen.getByRole('button', { name: 'Uložit' }));

      expect(onSubmit).toHaveBeenCalledWith({ name: 'Chata', visibility: 'private' });
      expect(onClose).toHaveBeenCalled();
    });

    it('deletes only after confirming', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const { onClose } = renderDrawer({ playlist, onDelete });

      await user.click(screen.getByRole('button', { name: 'Smazat playlist' }));
      expect(onDelete).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: 'Ponechat' }));
      await user.click(screen.getByRole('button', { name: 'Smazat playlist' }));
      await user.click(screen.getByRole('button', { name: 'Smazat' }));

      expect(onDelete).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalled();
    });

    it('stays open with an error when deleting fails', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn().mockRejectedValue(new Error('x'));
      const { onClose } = renderDrawer({ playlist, onDelete });

      await user.click(screen.getByRole('button', { name: 'Smazat playlist' }));
      await user.click(screen.getByRole('button', { name: 'Smazat' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Playlist se nepodařilo smazat.');
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
