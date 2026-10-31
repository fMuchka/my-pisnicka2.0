import { Eye, PencilLine } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Button from '../../../../components/_core/button/Button';
import ErrorMessage from '../../../../components/_core/error-message/ErrorMessage';
import Input from '../../../../components/_core/input/Input';
import SegmentGroup from '../../../../components/_core/segment-group/SegmentGroup';
import type { SegmentOption } from '../../../../components/_core/segment-group/types';
import Textarea from '../../../../components/_core/textarea/Textarea';
import { SongSheet } from '../../../../components/song-sheet';
import { isDraftValid, isValidCapo } from './draft';
import type { SongDraft, SongEditorView } from './types';
import styles from './SongEditor.module.css';

const viewOptions: SegmentOption[] = [
  { value: 'edit', label: 'Upravit', icon: PencilLine },
  { value: 'preview', label: 'Náhled', icon: Eye },
];

const TEXT_HELP =
  'Sekce: [verse], [chorus], [bridge], [intro], [outro]. Akord před slovem: [Am]slovo.';

type SongEditorProps = {
  initialDraft: SongDraft;
  onSubmit: (draft: SongDraft) => void;
  onCancel: () => void;
  isSaving?: boolean;
  error?: string | null;
};

export function SongEditor({
  initialDraft,
  onSubmit,
  onCancel,
  isSaving = false,
  error,
}: Readonly<SongEditorProps>) {
  const [draft, setDraft] = useState(initialDraft);
  const [view, setView] = useState<SongEditorView>('edit');

  const update = (field: keyof SongDraft) => (value: string) =>
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
