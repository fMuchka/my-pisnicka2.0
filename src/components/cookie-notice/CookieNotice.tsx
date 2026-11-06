import { Cookie } from 'lucide-react';
import Button from '../_core/button/Button';
import Drawer from '../_core/drawer/Drawer';
import IconBackdrop from '../_core/icon-backdrop/IconBackdrop';
import { useStorageConsent } from '../../stores/storageConsent';
import styles from './CookieNotice.module.css';

/** Asks once, on the first visit, whether the app may remember preferences in the browser. */
export function CookieNotice() {
  const consent = useStorageConsent((state) => state.consent);
  const setConsent = useStorageConsent((state) => state.setConsent);

  return (
    <Drawer
      open={consent === null}
      // Only the buttons below close it.
      onOpenChange={() => {}}
      keepOpen
      title="Sušenky, co nešmírují"
    >
      <div className={styles.body}>
        <IconBackdrop>
          <Cookie
            size={20}
            aria-hidden="true"
          />
        </IconBackdrop>
        <div className={styles.text}>
          <p>
            Přihlášení si prohlížeč pamatuje vždy, bez něj aplikace nefunguje. Se souhlasem si
            zapamatujeme i tvoje nastavení, jako motiv, barvu nebo velikost písma.
          </p>
          <p>Neměříme tě, nesledujeme a nemáme reklamy. Volbu změníš kdykoli v Nastavení.</p>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          label="Jen nezbytné"
          colorVariation="secondary"
          styleVariation="outlined"
          onClick={() => setConsent('declined')}
        />
        <Button
          label="Přijmout"
          onClick={() => setConsent('accepted')}
        />
      </div>
    </Drawer>
  );
}
