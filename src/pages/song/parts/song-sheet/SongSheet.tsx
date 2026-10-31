import { classNames } from '../../../../lib/classNames';
import { sectionLabel, sectionOptionStyle } from '../../../../lib/songTextEditor/sections';
import { toSheetSections, type SheetLine } from './sheet';
import styles from './SongSheet.module.css';

type SongSheetProps = {
  text: string;
  /** Semitones to shift every chord by. */
  transpose?: number;
  emptyText?: string;
};

function Line({ line }: Readonly<{ line: SheetLine }>) {
  if (!line.hasChords) {
    return <div className={styles.line}>{line.parts.map((part) => part.text).join('') || ' '}</div>;
  }

  // Every part gets a chord row, so lyrics without a chord still line up with the ones that have one.
  return (
    <div className={classNames(styles.line, styles.lineChorded)}>
      {line.parts.map((part, index) => (
        <span
          key={index}
          className={styles.part}
        >
          <span className={styles.chord}>{part.chord}</span>
          <span className={styles.lyric}>{part.text}</span>
        </span>
      ))}
    </div>
  );
}

/** Read-only song text: sections with a colored edge, chords drawn above the lyrics. */
export function SongSheet({
  text,
  transpose = 0,
  emptyText = 'Text písně zatím není k dispozici.',
}: Readonly<SongSheetProps>) {
  const sections = toSheetSections(text, transpose);

  if (sections.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <div className={styles.sheet}>
      {sections.map((section, sectionIndex) => (
        <section
          key={sectionIndex}
          className={classNames(styles.section, section.type && styles.sectionTyped)}
          style={section.type ? sectionOptionStyle(section.type) : undefined}
        >
          {section.type && <h2 className={styles.sectionLabel}>{sectionLabel(section.type)}</h2>}
          {section.lines.map((line, lineIndex) => (
            <Line
              key={lineIndex}
              line={line}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
