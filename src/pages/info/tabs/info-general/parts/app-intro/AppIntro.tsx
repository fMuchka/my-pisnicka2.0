import { History } from 'lucide-react';
import { classNames } from '../../../../../../lib/classNames';
import { LOGO_SRC } from '../../constants';
import styles from './AppIntro.module.css';

type AppIntroProps = {
  /** Date of the latest timeline entry; the history pill is hidden without one. */
  lastChangeLabel: string | null;
  onShowHistory: () => void;
};

export function AppIntro({ lastChangeLabel, onShowHistory }: Readonly<AppIntroProps>) {
  return (
    <section className={styles.appIntro}>
      <div className={styles.appIntroBrand}>
        <img
          src={LOGO_SRC}
          alt=""
          className={styles.appIntroLogo}
        />
        <h2 className={styles.appIntroTitle}>
          MyPísnička <span className={styles.appIntroVersion}>2.0</span>
        </h2>
      </div>
      <p className={styles.appIntroText}>
        Nástroj pro kytaristy a skupiny, kteří chtějí jednoduše trénovat, sdílet písně a hrát spolu
        v reálném čase.
      </p>
      <div className={styles.appIntroMeta}>
        {lastChangeLabel && (
          <button
            type="button"
            className={classNames(styles.metaPill, styles.metaPillLink)}
            onClick={onShowHistory}
          >
            <History
              className={styles.iconXs}
              aria-hidden="true"
            />
            Poslední změna {lastChangeLabel}
          </button>
        )}
        <span className={styles.metaPill}>Bez reklam · bez analytiky</span>
      </div>
    </section>
  );
}
