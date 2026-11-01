import { Music, Type } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '../../../../../components/_core/button/Button';
import SegmentGroup from '../../../../../components/_core/segment-group/SegmentGroup';
import type { SegmentOption } from '../../../../../components/_core/segment-group/types';
import Textarea from '../../../../../components/_core/textarea/Textarea';
import { ChordEditor } from '../chord-editor/ChordEditor';
import {
  parseSongDocument,
  serializeSongDocument,
  type SongDocument,
} from '../document/songDocument';
import { ImportSongDrawer } from '../import-song/ImportSongDrawer';
import { LyricsEditor } from '../lyrics-editor/LyricsEditor';
import styles from './SongTextEditor.module.css';

type SongTextEditorProps = {
  text: string;
  onChange: (text: string) => void;
};

type TextEditorMode = 'lyrics' | 'chords' | 'source';

const modeOptions: SegmentOption[] = [
  { value: 'lyrics', label: 'Text', icon: Type },
  { value: 'chords', label: 'Akordy', icon: Music },
];

const SOURCE_HELP =
  'Sekce: [verse], [chorus], [bridge], [intro], [outro]. Akord před slovem: [Am]slovo.';

/**
 * Edits the song text without its storage format in sight: lyrics as sections, chords by tapping
 * where they go. The raw text stays one quiet click away for whoever knows the format.
 */
export function SongTextEditor({ text, onChange }: Readonly<SongTextEditorProps>) {
  const [mode, setMode] = useState<TextEditorMode>('lyrics');
  // What goes into the import drawer; null while it's closed.
  const [importText, setImportText] = useState<string | null>(null);
  const document = useMemo(() => parseSongDocument(text), [text]);
  const changeDocument = (next: SongDocument) => onChange(serializeSongDocument(next));

  const importSong = (songText: string, placement: 'append' | 'replace') => {
    onChange(placement === 'append' ? `${text.trimEnd()}\n\n${songText}` : songText);
    setImportText(null);
  };

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
          type="button"
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
      <SegmentGroup
        aria-label="Co upravit"
        options={modeOptions}
        value={mode}
        onValueChange={(value) => setMode(value as TextEditorMode)}
      />

      {mode === 'lyrics' ? (
        <LyricsEditor
          document={document}
          onChange={changeDocument}
          onImportRequest={setImportText}
        />
      ) : (
        <ChordEditor
          document={document}
          onChange={changeDocument}
        />
      )}

      <Button
        type="button"
        className={styles.modeSwitch}
        label="Upravit zdrojový text"
        styleVariation="text"
        colorVariation="secondary"
        onClick={() => setMode('source')}
      />

      {importText !== null && (
        <ImportSongDrawer
          initialText={importText}
          hasText={document.length > 0}
          onImport={importSong}
          onClose={() => setImportText(null)}
        />
      )}
    </div>
  );
}
