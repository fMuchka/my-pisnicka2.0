import { Collapsible } from '@ark-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';
import { ChordChart } from '../../../../../components/chord-chart';
import styles from './SongChords.module.css';

type SongChordsProps = {
  chords: string[];
};

/** The song's chords in one line, expandable into their fingering charts. */
export function SongChords({ chords }: Readonly<SongChordsProps>) {
  if (chords.length === 0) return null;

  return (
    <Collapsible.Root
      className={styles.root}
      lazyMount
    >
      <Collapsible.Trigger className={styles.trigger}>
        <span className={styles.label}>Akordy</span>
        <span className={styles.list}>
          {chords.map((chord) => (
            <span
              key={chord}
              className={styles.chordChip}
            >
              {chord}
            </span>
          ))}
        </span>
        <Collapsible.Indicator className={styles.indicator}>
          <ChevronDown aria-hidden="true" />
        </Collapsible.Indicator>
      </Collapsible.Trigger>

      <Collapsible.Content className={styles.content}>
        <div className={styles.charts}>
          {chords.map((chord) => (
            <ChordChart
              key={chord}
              chord={chord}
            />
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
