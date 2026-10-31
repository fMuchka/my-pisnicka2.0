import { useState } from 'react';
import Button from '../../../../../components/_core/button/Button';
import Drawer from '../../../../../components/_core/drawer/Drawer';
import Textarea from '../../../../../components/_core/textarea/Textarea';
import { SongSheet } from '../../../../../components/song-sheet';
import { importChordSheet } from '../document/importChordSheet';
import styles from './ImportSongDrawer.module.css';

type ImportSongDrawerProps = {
  /** What was pasted, if the drawer opened from a paste. */
  initialText: string;
  /** Whether the song has text already: then the import can go after it or replace it. */
  hasText: boolean;
  onImport: (songText: string, placement: 'append' | 'replace') => void;
  onClose: () => void;
};

/**
 * Takes a song as copied from the web, chords on their own lines above the lyrics, and shows how
 * it'll come out before adding it.
 */
export function ImportSongDrawer({
  initialText,
  hasText,
  onImport,
  onClose,
}: Readonly<ImportSongDrawerProps>) {
  const [pasted, setPasted] = useState(initialText);
  const converted = importChordSheet(pasted);
  const isEmpty = converted.trim() === '';

  return (
    <Drawer
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title="Vložit píseň z internetu"
    >
      <p className={styles.intro}>
        Vlož text písně s akordy nad řádky, jak bývá na webu. Akordy přesuneme na správná místa a
        sekce jako „1.“ nebo „R:“ rozpoznáme.
      </p>

      <Textarea
        label="Zkopírovaný text"
        className={styles.pasted}
        rows={8}
        value={pasted}
        onValueChange={setPasted}
        spellCheck={false}
      />

      {!isEmpty && (
        <section
          className={styles.preview}
          aria-label="Náhled"
        >
          <h3 className={styles.previewTitle}>Takhle bude vypadat</h3>
          <SongSheet text={converted} />
        </section>
      )}

      <div className={styles.actions}>
        {hasText ? (
          <>
            <Button
              label="Nahradit text písně"
              colorVariation="secondary"
              styleVariation="outlined"
              disabled={isEmpty}
              onClick={() => onImport(converted, 'replace')}
            />
            <Button
              label="Přidat na konec"
              disabled={isEmpty}
              onClick={() => onImport(converted, 'append')}
            />
          </>
        ) : (
          <Button
            label="Vložit"
            disabled={isEmpty}
            onClick={() => onImport(converted, 'replace')}
          />
        )}
      </div>
    </Drawer>
  );
}
