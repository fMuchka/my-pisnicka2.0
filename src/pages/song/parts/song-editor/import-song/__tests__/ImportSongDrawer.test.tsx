import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportSongDrawer } from '../ImportSongDrawer';

const sheet = 'R:\nG     D\nLorem ipsum';

const renderDrawer = (props: Partial<Parameters<typeof ImportSongDrawer>[0]> = {}) => {
  const handlers = { onImport: vi.fn(), onClose: vi.fn() };
  render(
    <ImportSongDrawer
      initialText=""
      hasText={false}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe('ImportSongDrawer', () => {
  it('previews the converted song as it will look', () => {
    renderDrawer({ initialText: sheet });

    const preview = screen.getByRole('region', { name: 'Náhled' });
    expect(preview).toHaveTextContent('Refrén');
    expect(screen.getByText('D')).toHaveClass('chord');
  });

  it('inserts the converted song into an empty song', async () => {
    const user = userEvent.setup();
    const { onImport } = renderDrawer({ initialText: sheet });

    await user.click(screen.getByRole('button', { name: 'Vložit' }));

    expect(onImport).toHaveBeenCalledWith('[chorus]\n[G]Lorem [D]ipsum', 'replace');
  });

  it('can add to the end of a song that has text, or replace it', async () => {
    const user = userEvent.setup();
    const { onImport } = renderDrawer({ initialText: sheet, hasText: true });

    await user.click(screen.getByRole('button', { name: 'Přidat na konec' }));
    expect(onImport).toHaveBeenLastCalledWith('[chorus]\n[G]Lorem [D]ipsum', 'append');

    await user.click(screen.getByRole('button', { name: 'Nahradit text písně' }));
    expect(onImport).toHaveBeenLastCalledWith('[chorus]\n[G]Lorem [D]ipsum', 'replace');
  });

  it('waits for something to import', async () => {
    const user = userEvent.setup();
    renderDrawer();

    expect(screen.getByRole('button', { name: 'Vložit' })).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Náhled' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: 'Zkopírovaný text' }));
    await user.paste(sheet);
    expect(screen.getByRole('button', { name: 'Vložit' })).toBeEnabled();
  });
});
