import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  parseSongDocument,
  serializeSongDocument,
  type SongDocument,
} from '../../document/songDocument';
import { LyricsEditor } from '../LyricsEditor';

/** Renders the editor over stored song text and reports the text after each change. */
const renderLyrics = (text: string) => {
  const onText = vi.fn<(text: string) => void>();

  function Host() {
    const [document, setDocument] = useState<SongDocument>(() => parseSongDocument(text));
    return (
      <LyricsEditor
        document={document}
        onChange={(next) => {
          setDocument(next);
          onText(serializeSongDocument(next));
        }}
      />
    );
  }

  render(<Host />);
  return { lastText: () => onText.mock.lastCall?.[0] };
};

const song = '[verse]\n[Am]Lorem ipsum\n[chorus]\nUt [G]enim';

describe('LyricsEditor', () => {
  it('shows each section with its type and its lyrics without chords', () => {
    renderLyrics(song);

    expect(screen.getByRole('region', { name: 'Sloka 1' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Text sekce Sloka' })).toHaveValue('Lorem ipsum');
    expect(screen.getByRole('textbox', { name: 'Text sekce Refrén' })).toHaveValue('Ut enim');
    expect(screen.getAllByRole('combobox', { name: 'Typ sekce' })[1]).toHaveValue('chorus');
  });

  it('keeps the chords with their letters while typing', async () => {
    const user = userEvent.setup();
    const { lastText } = renderLyrics(song);
    const chorus = screen.getByRole('textbox', { name: 'Text sekce Refrén' });

    await user.click(chorus);
    await user.keyboard('{Home}Sed ');

    expect(lastText()).toBe('[verse]\n[Am]Lorem ipsum\n[chorus]\nSed Ut [G]enim');
  });

  it('starts a new song with an empty verse to type into', async () => {
    const user = userEvent.setup();
    const { lastText } = renderLyrics('');

    await user.type(screen.getByRole('textbox', { name: 'Text sekce Sloka' }), 'Lorem');

    expect(lastText()).toBe('[verse]\nLorem');
  });

  it('changes the type of a section', async () => {
    const user = userEvent.setup();
    const { lastText } = renderLyrics(song);

    await user.selectOptions(screen.getAllByRole('combobox', { name: 'Typ sekce' })[1]!, 'bridge');

    expect(lastText()).toBe('[verse]\n[Am]Lorem ipsum\n[bridge]\nUt [G]enim');
  });

  it('adds a section, guessing a chorus after a verse', async () => {
    const user = userEvent.setup();
    const { lastText } = renderLyrics('[verse]\nLorem');

    await user.click(screen.getByRole('button', { name: 'Přidat sekci' }));

    expect(lastText()).toBe('[verse]\nLorem\n[chorus]\n');
    expect(screen.getByRole('textbox', { name: 'Text sekce Refrén' })).toBeInTheDocument();
  });

  it('removes a section, but never the last one', async () => {
    const user = userEvent.setup();
    const { lastText } = renderLyrics(song);

    await user.click(screen.getByRole('button', { name: 'Odebrat sekci Sloka' }));

    expect(lastText()).toBe('[chorus]\nUt [G]enim');
    expect(screen.queryByRole('button', { name: /odebrat sekci/i })).not.toBeInTheDocument();
  });
});
