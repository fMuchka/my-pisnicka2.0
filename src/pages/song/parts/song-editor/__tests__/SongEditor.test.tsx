import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SongEditor } from '../SongEditor';
import { emptyDraft } from '../draft';
import type { SongDraft } from '../types';

const filled: SongDraft = {
  title: 'Kometa',
  artist: 'Nohavica',
  capo: '',
  text: '[verse]\n[C]Za sklem',
  instrument: 'guitar',
  tags: ['folk'],
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

  it('picks the instrument the chords are written for', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEditor();

    expect(screen.getByRole('radiogroup', { name: 'Akordy pro' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Kytaru' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Ukulele' }));
    await user.click(saveButton());

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ instrument: 'ukulele' }));
  });

  it('leaves the instrument unpicked for a song that never had one', () => {
    renderEditor({ initialDraft: { ...filled, instrument: '' } });

    expect(screen.getByRole('radio', { name: 'Kytaru' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Ukulele' })).not.toBeChecked();
  });

  it('adds and removes tags', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEditor();
    const tagsInput = screen.getByRole('textbox', { name: 'Štítky' });

    expect(screen.getByText('folk')).toBeInTheDocument();

    await user.type(tagsInput, 'táborák{Enter}');
    // Ark empties the input on the next animation frame, behind user-event's back, so user-event
    // would keep typing after the old text. Clearing through it keeps the two in step.
    await waitFor(() => expect(tagsInput).toHaveValue(''));
    await user.clear(tagsInput);
    await user.type(tagsInput, 'klasika,');
    await user.click(screen.getByRole('button', { name: 'Odebrat folk' }));
    await user.click(saveButton());

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['táborák', 'klasika'] })
    );
  });

  it('locks the tags when they could not be loaded, and saves them as unknown', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderEditor({ initialDraft: { ...filled, tags: null } });

    expect(screen.getByRole('textbox', { name: 'Štítky' })).toBeDisabled();
    expect(screen.getByText(/štítky se nepodařilo načíst/i)).toBeInTheDocument();

    await user.click(saveButton());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ tags: null }));
  });

  it('keeps save disabled until title and artist are filled', async () => {
    const user = userEvent.setup();
    renderEditor({ initialDraft: emptyDraft('guitar') });

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
