import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PlaylistEntry } from '../../../playlistEntries';
import { ReorderSongsDrawer } from '../ReorderSongsDrawer';

const entry = (refId: string, title: string, artist: string): PlaylistEntry => ({
  songRef: { id: refId, sourceSongId: title, position: 0 },
  song: { id: title, title, artist, ownerId: 'u1' },
});

const entries = [
  entry('r1', 'Vlaštovky', 'Traband'),
  entry('r2', 'Home', 'Edward Sharpe'),
  entry('r3', 'Amerika', 'Traband'),
];

const renderDrawer = (onSave = vi.fn().mockResolvedValue(undefined)) => {
  const onClose = vi.fn();
  render(
    <ReorderSongsDrawer
      playlistName="Táborák"
      entries={entries}
      onSave={onSave}
      onClose={onClose}
    />
  );
  return { onSave, onClose };
};

const shownTitles = () =>
  within(screen.getByRole('list', { name: 'Písně' }))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('span:nth-child(2) > span')?.textContent);

describe('ReorderSongsDrawer', () => {
  it('moves songs up and down, then saves the new order', async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderDrawer();

    expect(screen.getByRole('button', { name: 'Uložit pořadí' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Posunout Vlaštovky výš' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Posunout Amerika níž' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Posunout Amerika výš' }));
    await user.click(screen.getByRole('button', { name: 'Posunout Vlaštovky níž' }));
    expect(shownTitles()).toEqual(['Amerika', 'Vlaštovky', 'Home']);

    await user.click(screen.getByRole('button', { name: 'Uložit pořadí' }));

    expect(onSave).toHaveBeenCalledWith(['r3', 'r1', 'r2']);
    expect(onClose).toHaveBeenCalled();
  });

  it('sorts by artist, then title', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Seřadit podle interpreta a názvu' }));
    expect(shownTitles()).toEqual(['Home', 'Amerika', 'Vlaštovky']);

    await user.click(screen.getByRole('button', { name: 'Uložit pořadí' }));
    expect(onSave).toHaveBeenCalledWith(['r2', 'r3', 'r1']);
  });

  it('stays open with an error when saving fails', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer(vi.fn().mockRejectedValue(new Error('x')));

    await user.click(screen.getByRole('button', { name: 'Posunout Home výš' }));
    await user.click(screen.getByRole('button', { name: 'Uložit pořadí' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Pořadí se nepodařilo uložit.');
    expect(onClose).not.toHaveBeenCalled();
  });
});
