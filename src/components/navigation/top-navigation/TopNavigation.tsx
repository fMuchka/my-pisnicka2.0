import type { ReactNode } from 'react';
import { classNames } from '../../../lib/classNames';
import { UserOptions } from './user-options/UserOptions';
import styles from './TopNavigation.module.css';

type TopNavigationProps = {
  pageTitle?: string;
  fadeAway?: boolean;
  onHome: () => void;
  /** Rendered after the user options, e.g. the side menu trigger. */
  actions?: ReactNode;
};

export function TopNavigation({
  pageTitle,
  fadeAway = false,
  onHome,
  actions,
}: Readonly<TopNavigationProps>) {
  const hasPageTitle = Boolean(pageTitle?.trim());

  return (
    <header
      className={classNames(styles.topNav, fadeAway && styles.fadeAway)}
      inert={fadeAway}
    >
      <div className={styles.collapsible}>
        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.navTitle}
            onClick={onHome}
          >
            <img
              src="/mypisnicka-icon.svg"
              alt=""
              className={styles.logo}
              width="30"
              height="30"
            />
            MyPísnička
          </button>
          <div className={styles.navActions}>
            <UserOptions />
            {actions}
          </div>
        </div>

        {hasPageTitle && (
          <div className={styles.contextRow}>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>
        )}
      </div>
    </header>
  );
}
