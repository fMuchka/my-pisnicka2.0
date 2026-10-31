import { Check } from 'lucide-react';
import { SongSheet } from '../../../../components/song-sheet';
import { useTheme, type Theme } from '../../../../hooks/useTheme';
import { cssVar } from '../../../../styles/tokens';
import { presetOptions, themeOptions } from '../../constants';
import { SettingsSection } from '../settings-section/SettingsSection';
import styles from './VisualSettings.module.css';

// Placeholder lyrics: one verse and a chorus, so both section accents show.
const PREVIEW_SONG = [
  '[verse]',
  '[G]Lorem ipsum [Em]dolor sit, [C]amet conse[D]ctetur,',
  '[G]adipiscing [Em]elit, sed [C]do eius[D]mod tempor.',
  '[chorus]',
  '[C]Ut enim [D]ad minim, [G]veniam [Em]quis,',
  '[C]nostrud exer[D]citation [G]ullamco.',
].join('\n');

const themeSampleClass: Record<Theme, string | undefined> = {
  dark: styles.themeSampleDark,
  light: styles.themeSampleLight,
};

/** Theme and color preset pickers. */
export function VisualSettings() {
  const { theme, setTheme, colorPreset, setColorPreset } = useTheme();

  return (
    <>
      <SettingsSection title="Motiv">
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
      </SettingsSection>

      <SettingsSection title="Barva">
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
      </SettingsSection>

      <SettingsSection title="Náhled">
        {/* A real sheet, so it shows exactly how songs look with the chosen theme and color. */}
        <div className={styles.preview}>
          <SongSheet text={PREVIEW_SONG} />
        </div>
      </SettingsSection>
    </>
  );
}
