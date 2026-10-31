import { Toggle } from '../../../../components/_core/toggle';
import { useStorageConsent } from '../../../../stores/storageConsent';
import { SettingsSection } from '../settings-section/SettingsSection';
import styles from './PrivacySettings.module.css';

type StorageGroup = {
  title: string;
  items: string[];
};

// Keep in step with what the app actually stores (lib/preferenceStorage lists the split).
const storageGroups: StorageGroup[] = [
  {
    title: 'Vždy, protože bez toho aplikace nefunguje',
    items: [
      'Přihlášení.',
      'Relace, ke které ses připojil – jen do zavření karty.',
      'Tvoje písně, aby se aplikace načítala rychle. Po 30 dnech se stáhnou znovu.',
      'Tvoje volba z tohohle přepínače.',
    ],
  },
  {
    title: 'Jen se souhlasem',
    items: [
      'Motiv, barva a velikost písma.',
      'Nástroj a přepínače režimu hraní.',
      'Která novinka v Infu byla naposledy vidět.',
    ],
  },
  {
    title: 'Nikdy',
    items: ['Měření návštěvnosti, sledování ani reklamy. Nic z toho nepoužíváme.'],
  },
];

/** The storage consent switch, with a plain account of what the app keeps in the browser. */
export function PrivacySettings() {
  const consent = useStorageConsent((state) => state.consent);
  const setConsent = useStorageConsent((state) => state.setConsent);

  return (
    <SettingsSection title="Soukromí">
      <div className={styles.card}>
        <Toggle
          label="Pamatovat si moje nastavení"
          description="Bez souhlasu platí změny jen do obnovení stránky a uložené nastavení hned smažeme."
          checked={consent === 'accepted'}
          onCheckedChange={(checked) => setConsent(checked ? 'accepted' : 'declined')}
        />
      </div>

      <div className={styles.explanation}>
        <p>
          Neukládáme cookies v pravém slova smyslu, jen data v úložišti tvého prohlížeče. Nikam se z
          něj neposílají a smažeš je i vymazáním dat webu v prohlížeči.
        </p>
        {storageGroups.map((group) => (
          <div key={group.title}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <ul className={styles.items}>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
