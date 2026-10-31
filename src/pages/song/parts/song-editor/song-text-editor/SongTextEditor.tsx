import { useMemo, useState } from 'react';
import Button from '../../../../../components/_core/button/Button';
import Textarea from '../../../../../components/_core/textarea/Textarea';
import { parseSongDocument, serializeSongDocument } from '../document/songDocument';
import { LyricsEditor } from '../lyrics-editor/LyricsEditor';
import styles from './SongTextEditor.module.css';

type SongTextEditorProps = {
  text: string;
  onChange: (text: string) => void;
};

type TextEditorMode = 'lyrics' | 'source';

const SOURCE_HELP =
  'Sekce: [verse], [chorus], [bridge], [intro], [outro]. Akord před slovem: [Am]slovo.';

/**
 * Edits the song text without its storage format in sight: sections of plain lyrics. The raw text
 * stays one quiet click away for whoever knows the format.
 */
export function SongTextEditor({ text, onChange }: Readonly<SongTextEditorProps>) {
  const [mode, setMode] = useState<TextEditorMode>('lyrics');
  const document = useMemo(() => parseSongDocument(text), [text]);

  if (mode === 'source') {
    return (
      <div className={styles.textEditor}>
        <Textarea
          label="Zdrojový text"
          className={styles.source}
          rows={16}
          value={text}
          onValueChange={onChange}
          helperText={SOURCE_HELP}
          spellCheck={false}
        />
        <Button
          className={styles.modeSwitch}
          label="Zpět do editoru"
          styleVariation="text"
          colorVariation="secondary"
          onClick={() => setMode('lyrics')}
        />
      </div>
    );
  }

  return (
    <div className={styles.textEditor}>
      <LyricsEditor
        document={document}
        onChange={(next) => onChange(serializeSongDocument(next))}
      />
      <Button
        className={styles.modeSwitch}
        label="Upravit zdrojový text"
        styleVariation="text"
        colorVariation="secondary"
        onClick={() => setMode('source')}
      />
    </div>
  );
}
