import { ListPlus, Minus, Pencil, Play, Plus } from 'lucide-react';
import Button from '../../../../components/_core/button/Button';
import type { Song } from '../../../../lib/song';
import { songChords } from './song-chords/chords';
import { SongChords } from './song-chords/SongChords';
import styles from './SongHeader.module.css';

type SongHeaderProps = {
  song: Pick<Song, 'title' | 'artist' | 'capo' | 'originalKey' | 'chords' | 'text'>;
  /** Semitones the sheet is shifted by. */
  transpose: number;
  onTransposeChange: (transpose: number) => void;
  /** Shows the edit button when given. */
  onEdit?: () => void;
  /** Shows the add-to-playlist button when given. */
  onManagePlaylists?: () => void;
  onStartPlay: () => void;
};

const formatTranspose = (value: number) => (value > 0 ? `+${value}` : `${value}`);

/** Song title and artist with the capo, key and transposition row and the chords below. */
export function SongHeader({
  song,
  transpose,
  onTransposeChange,
  onEdit,
  onManagePlaylists,
  onStartPlay,
}: Readonly<SongHeaderProps>) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{song.title}</h1>
          <p className={styles.artist}>{song.artist}</p>
        </div>
        <div className={styles.actionButtons}>
          <Button
            icon={Play}
            label="Hrát"
            styleVariation="outlined"
            className={styles.playButton}
            onClick={onStartPlay}
          />
          {onManagePlaylists && (
            <Button
              icon={ListPlus}
              styleVariation="text"
              aria-label="Přidat do playlistu"
              onClick={onManagePlaylists}
            />
          )}
          {onEdit && (
            <Button
              icon={Pencil}
              styleVariation="text"
              aria-label="Upravit píseň"
              onClick={onEdit}
            />
          )}
        </div>
      </header>

      <div className={styles.details}>
        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Capo</dt>
            <dd className={styles.metaValue}>{song.capo ?? '—'}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Tónina</dt>
            <dd className={styles.metaValue}>{song.originalKey?.trim() || '—'}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Transpozice</dt>
            <dd className={styles.metaValue}>
              <Button
                type="button"
                className={styles.stepper}
                aria-label="Transponovat o půltón dolů"
                onClick={() => onTransposeChange(transpose - 1)}
                icon={Minus}
              />
              <output aria-live="polite">{formatTranspose(transpose)}</output>
              <Button
                type="button"
                className={styles.stepper}
                aria-label="Transponovat o půltón nahoru"
                onClick={() => onTransposeChange(transpose + 1)}
                icon={Plus}
              />
            </dd>
          </div>
        </dl>

        <SongChords chords={songChords(song, transpose)} />
      </div>
    </>
  );
}
