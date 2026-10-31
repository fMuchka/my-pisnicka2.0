import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  parseSongDocument,
  serializeSongDocument,
  type SongDocument,
} from '../../document/songDocument';
import { ChordEditor } from '../ChordEditor';

const renderChords = (text: string) => {
  const onText = vi.fn<(text: string) => void>();

  function Host() {
    const [document, setDocument] = useState<SongDocument>(() => parseSongDocument(text));
    return (
      <ChordEditor
        document={document}
        onChange={(next) => {
          setDocument(next);
          onText(serializeSongDocument(next));
        }}
      />
    );
  }

  const view = render(<Host />);
  /** The cell at `offset` of the `line`-th line on screen. */
  const cell = (line: number, offset: number) =>
    view.container.querySelectorAll('.line')[line]!.querySelectorAll('.cell')[
      offset
    ] as HTMLElement;

  return { lastText: () => onText.mock.lastCall?.[0], cell };
};

describe('ChordEditor', () => {
  it('shows the lyrics with their chords above, per section', () => {
    renderChords('[verse]\n[Am]Lorem ipsum');

    expect(screen.getByRole('heading', { name: 'Sloka' })).toBeInTheDocument();
    expect(screen.getByText('Am')).toHaveClass('chord');
  });

  it('asks for lyrics first in an empty song', () => {
    renderChords('');

    expect(screen.getByText(/nejdřív napiš text písně/i)).toBeInTheDocument();
  });

  it('places a chord on the tapped letter', async () => {
    const user = userEvent.setup();
    const { lastText, cell } = renderChords('[verse]\n[Am]Lorem ipsum');

    await user.click(cell(0, 6));
    expect(screen.getByText('Akord nad „ipsum“')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Am' }));

    expect(lastText()).toBe('[verse]\n[Am]Lorem [Am]ipsum');
  });

  it('changes and removes a chord already placed', async () => {
    const user = userEvent.setup();
    const { lastText, cell } = renderChords('[verse]\n[Am]Lorem');

    await user.click(cell(0, 0));
    await user.click(screen.getByRole('radio', { name: 'G' }));
    await user.click(screen.getByRole('radio', { name: 'dur' }));
    await user.click(screen.getByRole('button', { name: 'Použít G' }));
    expect(lastText()).toBe('[verse]\n[G]Lorem');

    await user.click(cell(0, 0));
    await user.click(screen.getByRole('button', { name: 'Odebrat G' }));
    expect(lastText()).toBe('[verse]\nLorem');
  });

  it('adds chords one after another at a line end', async () => {
    const user = userEvent.setup();
    const { lastText, cell } = renderChords('[intro]\n[G]');

    // The line ends in G, so the + after it is the next spot.
    await user.click(cell(0, 1));
    expect(screen.getByText('Akord na konec řádku')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'D' }));
    await user.click(screen.getByRole('button', { name: 'Použít D' }));

    expect(lastText()).toBe('[intro]\n[G]  [D]');
  });

  it('works from the keyboard: arrows move, Enter picks, Delete removes', async () => {
    const user = userEvent.setup();
    const { lastText } = renderChords('[verse]\n[Am]Lorem ipsum');
    const sheet = screen.getByRole('application', { name: 'Akordy v textu' });

    sheet.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByText('nad „Lorem“')).toBeInTheDocument();

    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Am' }));
    expect(lastText()).toBe('[verse]\n[Am]Lo[Am]rem ipsum');

    sheet.focus();
    await user.keyboard('{Delete}');
    expect(lastText()).toBe('[verse]\n[Am]Lorem ipsum');
  });
});
