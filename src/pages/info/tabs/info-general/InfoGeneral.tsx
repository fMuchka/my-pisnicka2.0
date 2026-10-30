import { ChevronDown, ExternalLink, History } from 'lucide-react';
import { getTimelineEntries } from '../../../../lib/timeline/timeline';
import { FAQS, FEATURES, LOGO_SRC } from './constants';
import IconBackdrop from '../../../../components/_core/icon-backdrop/IconBackdrop';
import { cx } from '../../../../components/_core/cx';
import styles from './InfoGeneral.module.css';

type InfoGeneralProps = {
  onShowHistory: () => void;
};

export function InfoGeneral({ onShowHistory }: Readonly<InfoGeneralProps>) {
  const lastChangeLabel = getTimelineEntries()[0]?.label ?? null;

  return (
    <div className={styles.general}>
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
          Nástroj pro kytaristy a skupiny, kteří chtějí jednoduše trénovat, sdílet písně a hrát
          spolu v reálném čase.
        </p>
        <div className={styles.heroMeta}>
          {lastChangeLabel && (
            <button
              type="button"
              className={cx(styles.metaPill, styles.metaPillLink)}
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

      <section className={styles.block}>
        <h3 className={styles.eyebrow}>Co aplikace umí</h3>
        <ul className={styles.features}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className={styles.feature}
            >
              <IconBackdrop>
                <Icon
                  className={styles.iconSm}
                  aria-hidden="true"
                />
              </IconBackdrop>
              <span>
                <strong className={styles.featureTitle}>{title}</strong>
                <span className={styles.featureText}>{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <figure className={styles.block}>
        <h3 className={styles.eyebrow}>Hlavní cíl</h3>
        <blockquote className={styles.goal}>
          Podpořit společné hraní bez složitého nastavování, bez reklam a bez bariér.
        </blockquote>
      </figure>

      <section className={styles.block}>
        <h3 className={styles.eyebrow}>Dobré vědět</h3>
        {FAQS.map(({ answer, question }, index) => (
          <details
            key={question}
            className={styles.faq}
            open={index === 0}
          >
            <summary className={styles.faqQuestion}>
              {question}
              <ChevronDown
                className={styles.chevron}
                aria-hidden="true"
              />
            </summary>
            <p className={styles.faqAnswer}>{answer}</p>
          </details>
        ))}
      </section>

      <a
        className={styles.v1Link}
        href="https://fmuchka.github.io/my-pisnicka/"
        target="_blank"
        rel="noopener"
      >
        <span className={styles.v1Text}>
          <span>První verze MyPísničky</span>
          <span className={styles.v1Meta}>Statický zpěvník ze září 2025</span>
        </span>
        <ExternalLink
          className={styles.iconSm}
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
