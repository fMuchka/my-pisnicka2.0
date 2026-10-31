import { create } from 'zustand';
import {
  applyStorageConsent,
  readStorageConsent,
  type StorageConsent,
} from '../lib/preferenceStorage';

type StorageConsentState = {
  /** null until the user decides; the notice shows until then. */
  consent: StorageConsent | null;
  setConsent: (consent: StorageConsent) => void;
};

/** Whether the user lets the app remember their preferences in the browser. */
export const useStorageConsent = create<StorageConsentState>()((set) => ({
  consent: readStorageConsent(),

  setConsent: (consent) => {
    applyStorageConsent(consent);
    set({ consent });
  },
}));
