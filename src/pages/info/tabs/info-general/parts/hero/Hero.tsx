import { History } from 'lucide-react';
import { classNames } from '../../../../../../lib/classNames';
import { LOGO_SRC } from '../../constants';
import styles from './Hero.module.css';

type HeroProps = {
  /** Date of the latest timeline entry; the history pill is hidden without one. */
  lastChangeLabel: string | null;
  onShowHistory: () => void;
};

export function Hero({ lastChangeLabel, onShowHistory }: Readonly<HeroProps>) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBrand}>
        <img
          src={LOGO_SRC}
          alt=""
          className={styles.heroLogo}
        />
        <h2 className={styles.heroTitle}>
          MyPísnička <span className={styles.heroVersion}>2.0</span>
        </h2>
      </div>
      <p className={styles.heroText}>
        Nástroj pro kytaristy a skupiny, kteří chtějí jednoduše trénovat, sdílet písně a hrát spolu
        v reálném čase.
      </p>
      <div className={styles.heroMeta}>
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
