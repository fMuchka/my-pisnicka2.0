import { useCallback, useRef, useState } from 'react';
import { SongSheet } from '../../../../components/song-sheet';
import { usePageNavigation } from '../../../../hooks/usePageNavigation';
import { useWakeLock } from '../../../../hooks/useWakeLock';
import type { Song } from '../../../../lib/song';
import { useFeaturePreferences } from '../../../../stores/featurePreferences';
import { PlayControls } from '../play-controls/PlayControls';
import { useAutoScroll } from '../play-controls/useAutoScroll';
import { SongHeader } from '../song-header/SongHeader';

type SongViewProps = {
  song: Song;
  /** Semitones the sheet is shifted by. Kept by the page, so it survives a trip to the editor. */
  transpose: number;
  onTransposeChange: (transpose: number) => void;
  /** Shows the edit button when given. */
  onEdit?: () => void;
  /** Shows the add-to-playlist button when given. */
  onManagePlaylists?: () => void;
};

/**
 * The song to read: header and sheet. In play mode the navigation hides, the header gives way to
 * the auto-scroll controls and the screen can be kept awake.
 */
export function SongView({
  song,
  transpose,
  onTransposeChange,
  onEdit,
  onManagePlaylists,
}: Readonly<SongViewProps>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const stopPlaying = useCallback(() => setIsPlaying(false), []);
  const sheetRef = useRef<HTMLDivElement>(null);

  const tapToToggleScroll = useFeaturePreferences((s) => s.tapToToggleScroll);
  const keepScreenAwake = useFeaturePreferences((s) => s.keepScreenAwake);
  const allowManualScroll = useFeaturePreferences((s) => s.allowManualScroll);

  usePageNavigation({ fadeAway: isPlaying });
  const autoScroll = useAutoScroll(isPlaying, sheetRef, { allowManualScroll });
  useWakeLock(isPlaying && keepScreenAwake);

  return (
    <>
      {isPlaying ? (
        <PlayControls
          isScrolling={autoScroll.isScrolling}
          secondsLeft={autoScroll.secondsLeft}
          canSpeedUp={autoScroll.canSpeedUp}
          canSlowDown={autoScroll.canSlowDown}
          onToggleScrolling={autoScroll.toggleScrolling}
          onSpeedUp={autoScroll.speedUp}
          onSlowDown={autoScroll.slowDown}
          onJump={autoScroll.jump}
          onExit={stopPlaying}
        />
      ) : (
        <SongHeader
          song={song}
          transpose={transpose}
          onTransposeChange={onTransposeChange}
          onEdit={onEdit}
          onManagePlaylists={onManagePlaylists}
          onStartPlay={() => setIsPlaying(true)}
        />
      )}

      {/* In play mode a tap anywhere on the text can pause or resume; the play button covers keyboard users. */}
      <div
        ref={sheetRef}
        onClick={isPlaying && tapToToggleScroll ? autoScroll.toggleScrolling : undefined}
      >
        <SongSheet
          text={song.text ?? ''}
          transpose={transpose}
        />
      </div>
    </>
  );
}
