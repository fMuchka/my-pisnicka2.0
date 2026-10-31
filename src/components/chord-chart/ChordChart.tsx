import { useEffect, useRef } from 'react';
import { ChordStyle, SVGuitarChord } from 'svguitar';
import { useTheme } from '../../hooks/useTheme';
import { getChordFingerPositions } from '../../lib/chords/chords';
import type { Instrument } from '../../lib/chords/chords.database';
import styles from './ChordChart.module.css';

type ChordChartProps = {
  chord: string;
};

const INSTRUMENT_SETTINGS: Record<Instrument, { strings: number; tuning: string[] }> = {
  guitar: { strings: 6, tuning: ['e', 'B', 'G', 'D', 'A', 'E'] },
  ukulele: { strings: 4, tuning: ['G', 'C', 'E', 'A'] },
};

/** Fingering diagram of one chord for the preferred instrument. */
export default function ChordChart({ chord }: Readonly<ChordChartProps>) {
  const instrument = useTheme((state) => state.preferredInstrument);
  const canvasRef = useRef<HTMLDivElement>(null);
  const positions = getChordFingerPositions(chord, instrument);

  useEffect(() => {
    if (canvasRef.current == null || positions == null) return;

    const chart = new SVGuitarChord(canvasRef.current)
      .configure({
        // svguitar writes colors into SVG attributes, which can't resolve var(); currentColor
        // takes the CSS color instead, so the chart follows the theme without being redrawn.
        color: 'currentColor',
        strokeWidth: 2,
        style: ChordStyle.handdrawn,
        ...INSTRUMENT_SETTINGS[instrument],
      })
      .chord(positions);
    chart.draw();

    return () => chart.remove();
  }, [positions, instrument]);

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.name}>{chord}</figcaption>
      {positions ? (
        <div
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={`Diagram akordu ${chord}`}
        />
      ) : (
        <p className={styles.missing}>Diagram není k dispozici</p>
      )}
    </figure>
  );
}
