import IconBackdrop from '../_core/icon-backdrop/IconBackdrop';
import type { Icon } from '../_core/types';
import styles from './NavTile.module.css';

type NavTileProps = {
  label: string;
  icon: Icon;
  meta?: string;
  /** Short highlight in the top-right corner, e.g. "Nové". */
  badge?: string;
  onClick?: () => void;
};

/** Large clickable card leading to a section of the app. Styling is fixed on purpose: no className. */
export default function NavTile({
  label,
  icon: Icon,
  meta,
  badge,
  onClick,
}: Readonly<NavTileProps>) {
  return (
    <button
      type="button"
      className={styles.navTile}
      onClick={onClick}
    >
      {badge && <span className={styles.navTileBadge}>{badge}</span>}
      <IconBackdrop
        shape="rounded"
        size="lg"
      >
        <Icon
          className={styles.navTileIcon}
          aria-hidden="true"
        />
      </IconBackdrop>
      <span className={styles.navTileText}>
        <span className={styles.navTileLabel}>{label}</span>
        {meta && <span className={styles.navTileMeta}>{meta}</span>}
      </span>
    </button>
  );
}
