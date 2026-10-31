import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChordPicker } from '../ChordPicker';

const renderPicker = (props: Partial<Parameters<typeof ChordPicker>[0]> = {}) => {
  const handlers = { onClose: vi.fn(), onPick: vi.fn(), onRemove: vi.fn() };
  render(
    <ChordPicker
      open
      target="nad „ipsum“"
      current={null}
      songChords={['G', 'D', 'Em']}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe('ChordPicker', () => {
  it('says where the chord goes', () => {
    renderPicker();

    expect(screen.getByText('Akord nad „ipsum“')).toBeInTheDocument();
  });

  it("picks one of the song's chords in one tap", async () => {
    const user = userEvent.setup();
    const { onPick } = renderPicker();

    await user.click(screen.getByRole('button', { name: 'Em' }));

    expect(onPick).toHaveBeenCalledWith('Em');
  });

  it('builds any other chord from a root and a kind', async () => {
    const user = userEvent.setup();
    const { onPick } = renderPicker();

    await user.click(screen.getByRole('radio', { name: 'F#' }));
    await user.click(screen.getByRole('radio', { name: 'moll' }));
    await user.click(screen.getByRole('button', { name: 'Použít F#m' }));

    expect(onPick).toHaveBeenCalledWith('F#m');
  });

  it('starts the builder from the chord already there, and offers to remove it', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderPicker({ current: 'C#7' });

    expect(screen.getByRole('radio', { name: 'C#' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '7' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Odebrat C#7' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('has no song chords section for a song without chords', () => {
    renderPicker({ songChords: [] });

    expect(screen.queryByRole('region', { name: 'Akordy v písni' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /odebrat/i })).not.toBeInTheDocument();
  });
});
