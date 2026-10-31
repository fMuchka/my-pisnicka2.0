import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Pause,
  Play,
  Rabbit,
  Turtle,
  X,
} from 'lucide-react';
import { useEffect, useId } from 'react';
import Button from '../../../../components/_core/button/Button';
import { formatTimeLeft, useTimeLeftVisible } from './timeLeft';
import type { JumpDirection } from './useAutoScroll';
import styles from './PlayControls.module.css';

type PlayControlsProps = {
  isScrolling: boolean;
  secondsLeft: number;
  canSpeedUp: boolean;
  canSlowDown: boolean;
  onToggleScrolling: () => void;
  onSpeedUp: () => void;
  onSlowDown: () => void;
  onJump: (direction: JumpDirection) => void;
  onExit: () => void;
};

/** Auto-scroll controls that stand in for the song header in play mode. */
export function PlayControls({
  isScrolling,
  secondsLeft,
  canSpeedUp,
  canSlowDown,
  onToggleScrolling,
  onSpeedUp,
  onSlowDown,
  onJump,
  onExit,
}: Readonly<PlayControlsProps>) {
  const [timeLeftVisible, toggleTimeLeft] = useTimeLeftVisible();
  const timeLeftId = useId();

  // The navigation is hidden in play mode, so Escape is the keyboard way back out.
  useEffect(() => {
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onExit();
    };

    document.addEventListener('keydown', exitOnEscape);
    return () => document.removeEventListener('keydown', exitOnEscape);
  }, [onExit]);

  return (
    <div
      className={styles.controls}
      role="toolbar"
      aria-label="Přehrávání"
    >
      <div className={styles.bar}>
        <div className={styles.actions}>
          <Button
            icon={ChevronsUp}
            styleVariation="text"
            aria-label="Zpět na předchozí část"
            onClick={() => onJump('back')}
          />
          <Button
            icon={Turtle}
            styleVariation="text"
            aria-label="Zpomalit posouvání"
            disabled={!canSlowDown}
            onClick={onSlowDown}
          />
          <Button
            icon={isScrolling ? Pause : Play}
            aria-label={isScrolling ? 'Pozastavit posouvání' : 'Spustit posouvání'}
            onClick={onToggleScrolling}
          />
          <Button
            icon={Rabbit}
            styleVariation="text"
            aria-label="Zrychlit posouvání"
            disabled={!canSpeedUp}
            onClick={onSpeedUp}
          />
          <Button
            icon={ChevronsDown}
            styleVariation="text"
            aria-label="Vpřed na další část"
            onClick={() => onJump('forward')}
          />
        </div>
        <Button
          icon={X}
          styleVariation="text"
          colorVariation="secondary"
          aria-label="Ukončit režim hraní"
          onClick={onExit}
        />
      </div>

      <div className={styles.timeLeftRow}>
        {timeLeftVisible && (
          <p
            id={timeLeftId}
            className={styles.timeLeft}
          >
            Do konce zbývá {formatTimeLeft(secondsLeft)}
          </p>
        )}
        <button
          type="button"
          className={styles.timeLeftToggle}
          aria-label={timeLeftVisible ? 'Skrýt zbývající čas' : 'Zobrazit zbývající čas'}
          aria-expanded={timeLeftVisible}
          aria-controls={timeLeftVisible ? timeLeftId : undefined}
          onClick={toggleTimeLeft}
        >
          {timeLeftVisible ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
