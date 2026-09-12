import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreatePlaylistDialog from '../CreatePlaylistDialog.vue';

describe('CreatePlaylistDialog', () => {
  it('disables submit until playlist name is filled', async () => {
    const user = userEvent.setup();

    render(CreatePlaylistDialog, {
      props: { open: true },
    });

    const submitButton = screen.getByTestId('create-playlist-submit');
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText(/název playlistu/i), 'Moje písně');
    expect(submitButton).toBeEnabled();
  });

  it('emits trimmed name and public visibility on submit', async () => {
    const user = userEvent.setup();

    const { emitted } = render(CreatePlaylistDialog, {
      props: { open: true },
    });

    await user.type(screen.getByLabelText(/název playlistu/i), '  Večer  ');
    await user.click(screen.getByLabelText(/veřejný playlist/i));
    await user.click(screen.getByTestId('create-playlist-submit'));

    expect(emitted().create).toContainEqual([
      {
        name: 'Večer',
        visibility: 'public',
      },
    ]);
  });

  it('shows passed error message', () => {
    render(CreatePlaylistDialog, {
      props: {
        open: true,
        error: 'Playlist se nepodařilo vytvořit.',
      },
    });

    expect(screen.getByText('Playlist se nepodařilo vytvořit.')).toBeInTheDocument();
  });
});