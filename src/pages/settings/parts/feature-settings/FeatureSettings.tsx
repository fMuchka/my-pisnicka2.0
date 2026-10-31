import { SegmentGroup } from '../../../../components/_core/segment-group';
import type { SegmentOption } from '../../../../components/_core/segment-group/types';
import { Toggle } from '../../../../components/_core/toggle';
import { useTheme } from '../../../../hooks/useTheme';
import type { Instrument } from '../../../../lib/chords/chords.database';
import {
  useFeaturePreferences,
  type FeaturePreferences,
} from '../../../../stores/featurePreferences';
import { PrivacySettings } from '../privacy-settings/PrivacySettings';
import { SettingsSection } from '../settings-section/SettingsSection';
import styles from './FeatureSettings.module.css';

type FeatureOption = {
  key: keyof FeaturePreferences;
  label: string;
  description: string;
};

const playModeFeatures: FeatureOption[] = [
  {
    key: 'timeLeftVisible',
    label: 'Zobrazovat zbývající čas',
    description: 'Pod ovládáním ukazuje, jak dlouho ještě potrvá posouvání do konce písně.',
  },
  {
    key: 'tapToToggleScroll',
    label: 'Pozastavit klepnutím na text',
    description: 'Klepnutí kamkoli na text písně posouvání pozastaví nebo znovu spustí.',
  },
  {
    key: 'keepScreenAwake',
    label: 'Nezhasínat obrazovku',
    description: 'Při hraní se telefon sám nezamkne, ani když se ho dlouho nedotkneš.',
  },
  {
    key: 'allowManualScroll',
    label: 'Ruční posouvání během hraní',
    description: 'I při automatickém posouvání můžeš text posunout prstem nebo kolečkem myši.',
  },
];

const instrumentOptions: SegmentOption[] = [
  { value: 'guitar', label: 'Kytara' },
  { value: 'ukulele', label: 'Ukulele' },
];

const isInstrument = (value: string): value is Instrument =>
  instrumentOptions.some((option) => option.value === value);

/** The preferred instrument, then on/off switches for the optional behaviours, each with a line on what it does. */
export function FeatureSettings() {
  const setPreference = useFeaturePreferences((state) => state.setPreference);
  const preferences = useFeaturePreferences();
  const preferredInstrument = useTheme((state) => state.preferredInstrument);
  const setPreferredInstrument = useTheme((state) => state.setPreferredInstrument);

  return (
    <>
      <SettingsSection title="Nástroj">
        <div className={styles.instrument}>
          <SegmentGroup
            aria-label="Preferovaný nástroj"
            options={instrumentOptions}
            value={preferredInstrument}
            onValueChange={(value) => {
              if (isInstrument(value)) setPreferredInstrument(value);
            }}
          />
          <p className={styles.description}>
            Podle něj se v celé aplikaci ukazují diagramy akordů – při hraní, tvorbě i úpravách
            písní.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection title="Režim hraní">
        <div className={styles.list}>
          {playModeFeatures.map((feature) => (
            <Toggle
              key={feature.key}
              label={feature.label}
              description={feature.description}
              checked={preferences[feature.key]}
              onCheckedChange={(checked) => setPreference(feature.key, checked)}
            />
          ))}
        </div>
      </SettingsSection>

      <PrivacySettings />
    </>
  );
}
