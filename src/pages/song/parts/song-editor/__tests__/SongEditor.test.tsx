import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SongEditor } from '../SongEditor';
import { EMPTY_DRAFT } from '../draft';
import type { SongDraft } from '../types';

const filled: SongDraft = {
  title: 'Kometa',
  artist: 'Nohavica',
  capo: '',
  text: '[verse]\n[C]Za sklem',
};

const renderEditor = (props: Partial<Parameters<typeof SongEditor>[0]> = {}) => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <SongEditor
      initialDraft={filled}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />
  );
  return { onSubmit, onCancel };
};

const saveButton = () => screen.getByRole('button', { name: 'Uložit' });

describe('SongEditor', () => {
  it('fills the form from the initial draft', () => {
    renderEditor();

    expect(screen.getByRole('textbox', { name: /název/i })).toHaveValue('Kometa');
    expect(screen.getByRole('textbox', { name: /interpret/i })).toHaveValue('Nohavica');
    expect(screen.getByRole('textbox', { name: /text písně/i })).toHaveValue(filled.text);
  });

  it('submits the edited draft', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEditor();

    await user.clear(screen.getByRole('textbox', { name: /název/i }));
    await user.type(screen.getByRole('textbox', { name: /název/i }), 'Bílá');
    await user.type(screen.getByRole('textbox', { name: /capo/i }), '3');
    await user.click(saveButton());

    expect(onSubmit).toHaveBeenCalledWith({ ...filled, title: 'Bílá', capo: '3' });
  });

  it('keeps save disabled until title and artist are filled', async () => {
    const user = userEvent.setup();
    renderEditor({ initialDraft: EMPTY_DRAFT });

    expect(saveButton()).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: /název/i }), 'Kometa');
    expect(saveButton()).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: /interpret/i }), 'Nohavica');
    expect(saveButton()).toBeEnabled();
  });

  it('flags an invalid capo and blocks saving', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByRole('textbox', { name: /capo/i }), '-1');

    expect(screen.getByText('Capo musí být nezáporné celé číslo.')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('previews the song text and keeps edits when switching back', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByRole('textbox', { name: /text písně/i }), ' výlohy');
    await user.click(screen.getByText('Náhled'));

    expect(screen.queryByRole('textbox', { name: /text písně/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sloka' })).toBeInTheDocument();
    expect(screen.getByText('C')).toHaveClass('chord');

    await user.click(screen.getByText('Upravit'));

    expect(screen.getByRole('textbox', { name: /text písně/i })).toHaveValue(
      `${filled.text} výlohy`
    );
  });

  it('calls onCancel without submitting', async () => {
    const user = userEvent.setup();
    const { onSubmit, onCancel } = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Zrušit' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the saving state and the error', () => {
    renderEditor({ isSaving: true, error: 'Nepodařilo se upravit píseň.' });

    expect(screen.getByRole('button', { name: 'Ukládám…' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Nepodařilo se upravit píseň.');
  });
});
