import { Eye, PencilLine } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Button from '../../../../components/_core/button/Button';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import Input from '../../../../components/_core/input/Input';
import SegmentGroup from '../../../../components/_core/segment-group/SegmentGroup';
import type { SegmentOption } from '../../../../components/_core/segment-group/types';
import { TagsInput } from '../../../../components/_core/tags-input';
import Textarea from '../../../../components/_core/textarea/Textarea';
import type { Instrument } from '../../../../lib/chords/chords.database';
import { SongSheet } from '../../../../components/song-sheet';
import { isDraftValid, isValidCapo } from './draft';
import type { SongDraft, SongEditorView } from './types';
import styles from './SongEditor.module.css';

const viewOptions: SegmentOption[] = [
  { value: 'edit', label: 'Upravit', icon: PencilLine },
  { value: 'preview', label: 'Náhled', icon: Eye },
];

const instrumentOptions: SegmentOption[] = [
  { value: 'guitar', label: 'Kytaru' },
  { value: 'ukulele', label: 'Ukulele' },
];

const isInstrument = (value: string): value is Instrument =>
  instrumentOptions.some((option) => option.value === value);

const TEXT_HELP =
  'Sekce: [verse], [chorus], [bridge], [intro], [outro]. Akord před slovem: [Am]slovo.';

type SongEditorProps = {
  initialDraft: SongDraft;
  /** Existing tags to offer while typing one. */
  tagSuggestions?: string[];
  onSubmit: (draft: SongDraft) => void;
  onCancel: () => void;
  isSaving?: boolean;
  error?: string | null;
};

export function SongEditor({
  initialDraft,
  tagSuggestions,
  onSubmit,
  onCancel,
  isSaving = false,
  error,
}: Readonly<SongEditorProps>) {
  const [draft, setDraft] = useState(initialDraft);
  const [view, setView] = useState<SongEditorView>('edit');

  const update = (field: 'title' | 'artist' | 'capo' | 'text') => (value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isDraftValid(draft) && !isSaving) onSubmit(draft);
  };

  return (
    <form
      className={styles.editor}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className={styles.fields}>
        <Input
          label="Název"
          value={draft.title}
          onValueChange={update('title')}
          required
        />
        <Input
          label="Interpret"
          value={draft.artist}
          onValueChange={update('artist')}
          required
        />
        <Input
          label="Capo"
          inputMode="numeric"
          value={draft.capo}
          onValueChange={update('capo')}
          invalid={!isValidCapo(draft.capo)}
          errorText="Capo musí být nezáporné celé číslo."
        />
        <SegmentGroup
          label="Akordy pro"
          options={instrumentOptions}
          value={draft.instrument}
          onValueChange={(value) => {
            if (isInstrument(value)) setDraft((current) => ({ ...current, instrument: value }));
          }}
        />
        <TagsInput
          label="Štítky"
          value={draft.tags ?? []}
          onValueChange={(tags) => setDraft((current) => ({ ...current, tags }))}
          suggestions={tagSuggestions}
          placeholder="Např. táborák, česká klasika"
          helperText={
            draft.tags === null
              ? 'Štítky se nepodařilo načíst, uložením se nezmění.'
              : 'Štítek potvrdíš Enterem nebo čárkou.'
          }
          disabled={draft.tags === null}
        />
      </div>

      <SegmentGroup
        aria-label="Režim editoru"
        options={viewOptions}
        value={view}
        onValueChange={(value) => setView(value as SongEditorView)}
      />

      {view === 'edit' ? (
        <Textarea
          label="Text písně"
          className={styles.text}
          rows={16}
          value={draft.text}
          onValueChange={update('text')}
          helperText={TEXT_HELP}
          spellCheck={false}
        />
      ) : (
        <div className={styles.preview}>
          <SongSheet text={draft.text} />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <div className={styles.actions}>
        <Button
          type="button"
          label="Zrušit"
          colorVariation="secondary"
          styleVariation="outlined"
          onClick={onCancel}
        />
        <Button
          type="submit"
          label={isSaving ? 'Ukládám…' : 'Uložit'}
          disabled={!isDraftValid(draft) || isSaving}
        />
      </div>
    </form>
  );
}
