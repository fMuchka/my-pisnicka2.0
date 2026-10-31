import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SongTextEditor } from '../SongTextEditor';

const renderTextEditor = (initialText: string) => {
  const onChange = vi.fn<(text: string) => void>();

  function Host() {
    const [text, setText] = useState(initialText);
    return (
      <SongTextEditor
        text={text}
        onChange={(next) => {
          setText(next);
          onChange(next);
        }}
      />
    );
  }

  render(<Host />);
  return { onChange };
};

describe('SongTextEditor', () => {
  it('opens on the lyrics, with the source text tucked away', () => {
    renderTextEditor('[verse]\n[Am]Lorem');

    expect(screen.getByRole('textbox', { name: 'Text sekce Sloka' })).toHaveValue('Lorem');
    expect(screen.queryByRole('textbox', { name: 'Zdrojový text' })).not.toBeInTheDocument();
  });

  it('switches between the lyrics and the chords', async () => {
    const user = userEvent.setup();
    renderTextEditor('[verse]\n[Am]Lorem');

    await user.click(screen.getByRole('radio', { name: 'Akordy' }));

    expect(screen.getByRole('application', { name: 'Akordy v textu' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Text sekce Sloka' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Text' }));
    expect(screen.getByRole('textbox', { name: 'Text sekce Sloka' })).toBeInTheDocument();
  });

  it('imports a song pasted into a section, after the existing text', async () => {
    const user = userEvent.setup();
    const { onChange } = renderTextEditor('[verse]\nLorem');

    await user.click(screen.getByRole('textbox', { name: 'Text sekce Sloka' }));
    await user.paste('R:\nC   G\nUt enim');
    expect(screen.getByRole('textbox', { name: 'Zkopírovaný text' })).toHaveValue(
      'R:\nC   G\nUt enim'
    );

    await user.click(screen.getByRole('button', { name: 'Přidat na konec' }));

    expect(onChange).toHaveBeenLastCalledWith('[verse]\nLorem\n\n[chorus]\n[C]Ut e[G]nim');
    expect(screen.getByRole('textbox', { name: 'Text sekce Refrén' })).toHaveValue('Ut enim');
  });

  it('edits the raw text in source mode and goes back to the editor', async () => {
    const user = userEvent.setup();
    const { onChange } = renderTextEditor('[verse]\n[Am]Lorem');

    await user.click(screen.getByRole('button', { name: 'Upravit zdrojový text' }));
    const source = screen.getByRole('textbox', { name: 'Zdrojový text' });
    expect(source).toHaveValue('[verse]\n[Am]Lorem');

    // `[[` types a literal "[" (a single one starts a key name in user-event).
    await user.type(source, ' [[C]ipsum');
    expect(onChange).toHaveBeenLastCalledWith('[verse]\n[Am]Lorem [C]ipsum');

    await user.click(screen.getByRole('button', { name: 'Zpět do editoru' }));
    expect(screen.getByRole('textbox', { name: 'Text sekce Sloka' })).toHaveValue('Lorem ipsum');
  });
});
