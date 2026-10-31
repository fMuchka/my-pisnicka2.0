import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayControls } from '../PlayControls';

const song = { title: 'Kometa', artist: 'Jaromír Nohavica' };

describe('PlayControls', () => {
  it('shows the song in a compact toolbar', () => {
    render(
      <PlayControls
        song={song}
        onStop={vi.fn()}
      />
    );

    expect(screen.getByRole('toolbar', { name: 'Přehrávání' })).toHaveClass('controls');
    expect(screen.getByText('Kometa')).toHaveClass('title');
    expect(screen.getByText('Jaromír Nohavica')).toHaveClass('artist');
  });

  it('stops playing from the stop button or with Escape', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(
      <PlayControls
        song={song}
        onStop={onStop}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Ukončit přehrávání' }));
    await user.keyboard('{Escape}');

    expect(onStop).toHaveBeenCalledTimes(2);
  });

  it('stops listening for Escape once unmounted', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const { unmount } = render(
      <PlayControls
        song={song}
        onStop={onStop}
      />
    );

    unmount();
    await user.keyboard('{Escape}');

    expect(onStop).not.toHaveBeenCalled();
  });
});
