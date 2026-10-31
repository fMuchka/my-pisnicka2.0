import { useId, useState, type KeyboardEvent } from 'react';
import { classNames } from '../../../../../lib/classNames';
import { sectionLabel, sectionOptionStyle } from '../../../../../lib/songTextEditor/sections';
import { ChordPicker } from '../chord-picker/ChordPicker';
import {
  appendChord,
  chordAt,
  documentChords,
  placeChord,
  removeChord,
  type DocumentLine,
  type SongDocument,
} from '../document/songDocument';
import { sameSpot, stepCaret, type LineRef, type Spot } from './caret';
import styles from './ChordEditor.module.css';

type ChordEditorProps = {
  document: SongDocument;
  onChange: (document: SongDocument) => void;
};

const START: Spot = { section: 0, line: 0, offset: 0 };

/** Where the chord goes, in words: above the word around the spot, or at the line end. */
const describeSpot = (line: DocumentLine, offset: number) => {
  if (offset >= line.lyrics.length) return 'na konec řádku';

  const start = line.lyrics.lastIndexOf(' ', offset) + 1;
  const end = line.lyrics.indexOf(' ', offset);
  const word = line.lyrics.slice(start, end === -1 ? undefined : end).trim();

  return word ? `nad „${word}“` : 'nad mezerou';
};

/** For screen readers: where the keyboard caret is and what chord sits there. */
const announceSpot = (line: DocumentLine | undefined, offset: number) => {
  if (!line) return '';

  const chord = chordAt(line, offset);
  const place = describeSpot(line, offset);

  return chord ? `${place}, akord ${chord}` : place;
};

/**
 * The last spot on a line: its end, or one past it when a chord already sits at the end, so there's
 * always a + to add the next chord after it (an intro of chords only, say).
 */
const lastSpot = (line: DocumentLine) =>
  chordAt(line, line.lyrics.length) === null ? line.lyrics.length : line.lyrics.length + 1;

/**
 * Chords hang over their letter without widening it, so words stay whole. Only when the next chord
 * (or the + after the last one) would run into a label does that cell make room, in ch.
 */
const roomForLabel = (line: DocumentLine, offset: number, label: string) => {
  const nextOffsets = [...line.chords.map((placed) => placed.offset), lastSpot(line)];
  const next = Math.min(...nextOffsets.filter((candidate) => candidate > offset));
  const needed = label.length + 1;

  return next - offset < needed ? `${needed}ch` : undefined;
};

// Older songs can have chords right next to each other ("[G][D]"): a spot shows them all.
const chordsAt = (line: DocumentLine, offset: number) =>
  line.chords
    .filter((placed) => placed.offset === offset)
    .map((placed) => placed.chord)
    .join(' ');

/**
 * The lyrics as they'll look, chords above. Tapping a letter (or the + at a line end) opens the
 * chord picker for that spot; the arrow keys and Enter do the same from the keyboard.
 */
export function ChordEditor({ document, onChange }: Readonly<ChordEditorProps>) {
  const [caret, setCaret] = useState<Spot | null>(null);
  const [pickerSpot, setPickerSpot] = useState<Spot | null>(null);
  const hintId = useId();

  if (document.length === 0) {
    return <p className={styles.empty}>Nejdřív napiš text písně, akordy pak doplníš sem.</p>;
  }

  const lineAt = (spot: Spot) => document[spot.section]?.lines[spot.line];
  const lineRefs: LineRef[] = document.flatMap((section, sectionIndex) =>
    section.lines.map((line, lineIndex) => ({
      section: sectionIndex,
      line: lineIndex,
      length: lastSpot(line),
    }))
  );

  const updateLine = (spot: Spot, change: (line: DocumentLine) => DocumentLine) =>
    onChange(
      document.map((section, sectionIndex) =>
        sectionIndex === spot.section
          ? {
              ...section,
              lines: section.lines.map((line, lineIndex) =>
                lineIndex === spot.line ? change(line) : line
              ),
            }
          : section
      )
    );

  const pick = (spot: Spot, chord: string) => {
    updateLine(spot, (line) =>
      spot.offset > line.lyrics.length
        ? appendChord(line, chord)
        : placeChord(line, spot.offset, chord)
    );
    setPickerSpot(null);
  };

  const remove = (spot: Spot) => updateLine(spot, (line) => removeChord(line, spot.offset));

  const handleKeyDown = (event: KeyboardEvent) => {
    const current = caret ?? START;

    if (event.key === 'Enter' || event.key === ' ') {
      setPickerSpot(current);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      remove(current);
    } else {
      const next = stepCaret(lineRefs, current, event.key);
      if (!next) return;
      setCaret(next);
    }

    event.preventDefault();
  };

  const pickerLine = pickerSpot ? lineAt(pickerSpot) : undefined;

  return (
    <>
      <p
        id={hintId}
        className={styles.hint}
      >
        Klepni na písmeno, nad které patří akord.
      </p>

      {/* One stop for the keyboard: the arrows move a caret inside, Enter opens the picker. */}
      <div
        className={styles.sheet}
        role="application"
        tabIndex={0}
        aria-label="Akordy v textu"
        aria-describedby={hintId}
        onKeyDown={handleKeyDown}
        onFocus={() => setCaret((current) => current ?? START)}
      >
        {document.map((section, sectionIndex) => (
          <section
            // Re-read from the song text on every change: position is all the identity there is.
            key={sectionIndex}
            className={styles.section}
            style={section.type ? sectionOptionStyle(section.type) : undefined}
          >
            {section.type && <h3 className={styles.sectionLabel}>{sectionLabel(section.type)}</h3>}
            {section.lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                className={styles.line}
              >
                {Array.from({ length: lastSpot(line) + 1 }, (_, offset) => {
                  const spot = { section: sectionIndex, line: lineIndex, offset };
                  const chords = chordsAt(line, offset);
                  const isPastText = offset >= line.lyrics.length;

                  return (
                    // Mouse and touch only; keyboard users reach every spot with the caret above.
                    <span
                      key={offset}
                      className={classNames(styles.cell, sameSpot(caret, spot) && styles.cellCaret)}
                      style={chords ? { minWidth: roomForLabel(line, offset, chords) } : undefined}
                      onClick={() => {
                        setCaret(spot);
                        setPickerSpot(spot);
                      }}
                    >
                      {chords && <span className={styles.chord}>{chords}</span>}
                      {!chords && isPastText && (
                        <span className={classNames(styles.chord, styles.add)}>+</span>
                      )}
                      <span className={styles.char}>{line.lyrics[offset] ?? ' '}</span>
                    </span>
                  );
                })}
              </div>
            ))}
          </section>
        ))}
      </div>

      <p
        className={styles.visuallyHidden}
        aria-live="polite"
      >
        {caret ? announceSpot(lineAt(caret), caret.offset) : ''}
      </p>

      {pickerSpot && pickerLine && (
        <ChordPicker
          key={`${pickerSpot.section}-${pickerSpot.line}-${pickerSpot.offset}`}
          open
          onClose={() => setPickerSpot(null)}
          target={describeSpot(pickerLine, pickerSpot.offset)}
          current={chordAt(pickerLine, pickerSpot.offset)}
          songChords={documentChords(document)}
          onPick={(chord) => pick(pickerSpot, chord)}
          onRemove={() => {
            remove(pickerSpot);
            setPickerSpot(null);
          }}
        />
      )}
    </>
  );
}
