import { useState, type FormEvent } from 'react';
import Button from '../../../../components/_core/button/Button';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import Input from '../../../../components/_core/input/Input';
import SegmentGroup from '../../../../components/_core/segment-group/SegmentGroup';
import type { SegmentOption } from '../../../../components/_core/segment-group/types';
import { TagsInput } from '../../../../components/_core/tags-input';
import { Toggle } from '../../../../components/_core/toggle';
import type { Instrument } from '../../../../lib/chords/chords.database';
import { isDraftValid, isValidCapo } from './draft';
import { SongTextEditor } from './song-text-editor/SongTextEditor';
import type { SongDraft } from './types';
import styles from './SongEditor.module.css';

const instrumentOptions: SegmentOption[] = [
  { value: 'guitar', label: 'Kytaru' },
  { value: 'ukulele', label: 'Ukulele' },
];

const isInstrument = (value: string): value is Instrument =>
  instrumentOptions.some((option) => option.value === value);

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
        <Toggle
          label="Veřejná píseň"
          description="Veřejnou píseň najdou a zahrají si i ostatní. Sdílením písní pomáháš budovat zpěvník pro všechny."
          checked={draft.visibility === 'public'}
          onCheckedChange={(isPublic) =>
            setDraft((current) => ({ ...current, visibility: isPublic ? 'public' : 'private' }))
          }
        />
      </div>

      <SongTextEditor
        text={draft.text}
        onChange={update('text')}
      />

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
