import { Toggle } from '../../../../components/_core/toggle';
import {
  useFeaturePreferences,
  type FeaturePreferences,
} from '../../../../stores/featurePreferences';
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

/** On/off switches for the app's optional behaviours, each with a line on what it does. */
export function FeatureSettings() {
  const setPreference = useFeaturePreferences((state) => state.setPreference);
  const preferences = useFeaturePreferences();

  return (
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
  );
}
