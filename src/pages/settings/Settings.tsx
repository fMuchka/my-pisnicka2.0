import { Link } from 'react-router';
import { ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useTheme, type Theme } from '../../hooks/useTheme';
import { selectActiveSessionRoute, useSessionStore } from '../../stores/session';
import { cssVar } from '../../styles/tokens';
import { presetOptions, themeOptions } from './constants';
import styles from './Settings.module.css';

const themeSampleClass: Record<Theme, string | undefined> = {
  dark: styles.themeSampleDark,
  light: styles.themeSampleLight,
};

export default function Settings() {
  usePageNavigation({ pageTitle: 'Nastavení' });

  const { theme, setTheme, colorPreset, setColorPreset } = useTheme();
  const { isGuest } = useAuth();
  const activeSessionRoute = useSessionStore(selectActiveSessionRoute);

  // Guests have no tab bar or menu links, so give them a way back to their session.
  const sessionLink = isGuest ? activeSessionRoute : null;

  return (
    <section className={styles.container}>
      {sessionLink && (
        <Link
          to={sessionLink}
          className={styles.backLink}
        >
          <ChevronLeft
            className={styles.backIcon}
            aria-hidden="true"
          />
          Zpět do relace
        </Link>
      )}

      <section
        className={styles.section}
        aria-labelledby="settings-theme"
      >
        <div className={styles.eyebrow}>
          <span className={styles.dot} />
          <h2 id="settings-theme">Motiv</h2>
        </div>
        <div className={styles.themeGrid}>
          {themeOptions.map((option) => {
            const isActive = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={
                  isActive ? `${styles.themeCard} ${styles.themeCardActive}` : styles.themeCard
                }
                aria-pressed={isActive}
                onClick={() => setTheme(option.value)}
              >
                <span className={`${styles.themeSample} ${themeSampleClass[option.value]}`} />
                <span className={styles.themeLabel}>{option.label}</span>
                <span className={styles.themeDescription}>{option.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="settings-color"
      >
        <div className={styles.eyebrow}>
          <span className={styles.dot} />
          <h2 id="settings-color">Barva</h2>
        </div>
        <div className={styles.swatchGrid}>
          {presetOptions.map((option) => {
            const isActive = colorPreset === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={isActive ? `${styles.swatch} ${styles.swatchActive}` : styles.swatch}
                style={{ color: cssVar(`preset-${option.value}-vivid`) }}
                aria-pressed={isActive}
                onClick={() => setColorPreset(option.value)}
              >
                <span className={styles.swatchCircle}>
                  {isActive && (
                    <Check
                      className={styles.swatchCheck}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className={styles.swatchLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="settings-preview"
      >
        <div className={styles.eyebrow}>
          <span className={styles.dot} />
          <h2 id="settings-preview">Náhled</h2>
        </div>
        <div className={styles.previewPlaceholder}>Náhled bude brzy</div>
      </section>
    </section>
  );
}
