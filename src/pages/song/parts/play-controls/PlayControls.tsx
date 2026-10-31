import { Square } from 'lucide-react';
import { useEffect } from 'react';
import Button from '../../../../components/_core/button/Button';
import type { Song } from '../../../../lib/song';
import styles from './PlayControls.module.css';

type PlayControlsProps = {
  song: Pick<Song, 'title' | 'artist'>;
  onStop: () => void;
};

/** Compact bar that stands in for the song header while the song is playing. */
export function PlayControls({ song, onStop }: Readonly<PlayControlsProps>) {
  // The navigation is hidden while playing, so Escape is the keyboard way back out.
  useEffect(() => {
    const stopOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onStop();
    };

    document.addEventListener('keydown', stopOnEscape);
    return () => document.removeEventListener('keydown', stopOnEscape);
  }, [onStop]);

  return (
    <div
      className={styles.controls}
      role="toolbar"
      aria-label="Přehrávání"
    >
      <div className={styles.text}>
        <p className={styles.title}>{song.title}</p>
        <p className={styles.artist}>{song.artist}</p>
      </div>
      <Button
        icon={Square}
        styleVariation="outlined"
        aria-label="Ukončit přehrávání"
        onClick={onStop}
      />
    </div>
  );
}
