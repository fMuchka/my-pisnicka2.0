import { useState } from 'react';
import Button from '../../../../../components/_core/button/Button';
import Drawer from '../../../../../components/_core/drawer/Drawer';
import { CHORD_QUALITIES, CHROMATIC_SCALE } from '../../../../../lib/chords/chords.database';
import { normalizeChord } from '../../../../../lib/chords/chords';
import { classNames } from '../../../../../lib/classNames';
import styles from './ChordPicker.module.css';

type ChordPickerProps = {
  open: boolean;
  onClose: () => void;
  /** Where the chord goes, e.g. nad „ipsum“, for the title. */
  target: string;
  /** The chord already there, if any. */
  current: string | null;
  /** Chords used in the song, offered first: most songs reuse a handful. */
  songChords: string[];
  onPick: (chord: string) => void;
  onRemove: () => void;
};

const QUALITY_LABELS: Record<string, string> = { '': 'dur', m: 'moll' };

const splitChord = (chord: string | null) => {
  const root = chord
    ? CHROMATIC_SCALE.find((note) => chord.startsWith(note) && !chord.startsWith(`${note}#`))
    : undefined;
  return { root: root ?? 'C', quality: root && chord ? chord.slice(root.length) : '' };
};

/** Picks the chord for one spot in the lyrics: one of the song's chords, or any root and kind. */
export function ChordPicker({
  open,
  onClose,
  target,
  current,
  songChords,
  onPick,
  onRemove,
}: Readonly<ChordPickerProps>) {
  const [root, setRoot] = useState(() => splitChord(current).root);
  const [quality, setQuality] = useState(() => splitChord(current).quality);
  const composed = normalizeChord(`${root}${quality}`) ?? root;

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={`Akord ${target}`}
    >
      {songChords.length > 0 && (
        <section
          className={styles.group}
          aria-label="Akordy v písni"
        >
          <h3 className={styles.groupTitle}>V písni</h3>
          <div className={styles.chips}>
            {songChords.map((chord) => (
              <button
                key={chord}
                type="button"
                className={classNames(styles.chip, chord === current && styles.chipCurrent)}
                aria-pressed={chord === current}
                onClick={() => onPick(chord)}
              >
                {chord}
              </button>
            ))}
          </div>
        </section>
      )}

      <section
        className={styles.group}
        aria-label="Jiný akord"
      >
        <h3 className={styles.groupTitle}>{songChords.length > 0 ? 'Jiný akord' : 'Akord'}</h3>
        <div
          className={styles.grid}
          role="radiogroup"
          aria-label="Tónina"
        >
          {CHROMATIC_SCALE.map((note) => (
            <button
              key={note}
              type="button"
              role="radio"
              aria-checked={note === root}
              className={classNames(styles.option, note === root && styles.optionSelected)}
              onClick={() => setRoot(note)}
            >
              {note}
            </button>
          ))}
        </div>
        <div
          className={styles.grid}
          role="radiogroup"
          aria-label="Druh"
        >
          {CHORD_QUALITIES.map((kind) => (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={kind === quality}
              className={classNames(styles.option, kind === quality && styles.optionSelected)}
              onClick={() => setQuality(kind)}
            >
              {QUALITY_LABELS[kind] ?? kind}
            </button>
          ))}
        </div>
        <Button
          type="button"
          label={`Použít ${composed}`}
          onClick={() => onPick(composed)}
        />
      </section>

      {current && (
        <Button
          type="button"
          label={`Odebrat ${current}`}
          styleVariation="text"
          colorVariation="secondary"
          onClick={onRemove}
        />
      )}
    </Drawer>
  );
}
