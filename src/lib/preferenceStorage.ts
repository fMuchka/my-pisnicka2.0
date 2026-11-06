// Saving of the non-essential data (preferences, the timeline marker) goes through here, so it
// only reaches localStorage once the user has accepted it. Until then writes wait in memory and
// still work for the visit; accepting saves them, declining drops them along with anything saved.
//
// Essential data does not come through here: the login (Firebase), the joined session and the
// consent choice itself.

export const STORAGE_CONSENT_KEY = 'my-pisnicka:cookie-notice-consent';

export type StorageConsent = 'accepted' | 'declined';

// Kept when declining: needed for the app to work, or the choice itself.
const ESSENTIAL_KEYS = new Set([STORAGE_CONSENT_KEY]);
const PREFERENCE_KEY_PREFIX = 'my-pisnicka:';

export const readStorageConsent = (): StorageConsent | null => {
  try {
    const value = localStorage.getItem(STORAGE_CONSENT_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
};

let accepted = readStorageConsent() === 'accepted';
// null marks a removal.
const pending = new Map<string, string | null>();

const write = (key: string, value: string | null) => {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // Storage blocked: the value lasts until the page is reloaded.
  }
};

/** Reads a preference, including one that is still waiting for consent. */
export const getPreferenceItem = (key: string): string | null => {
  if (pending.has(key)) return pending.get(key) ?? null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setPreferenceItem = (key: string, value: string) => {
  if (accepted) {
    write(key, value);
  } else {
    pending.set(key, value);
  }
};

export const removePreferenceItem = (key: string) => {
  if (accepted) {
    write(key, null);
  } else {
    pending.set(key, null);
  }
};

const removeSavedPreferences = () => {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));

    for (const key of keys) {
      if (key?.startsWith(PREFERENCE_KEY_PREFIX) && !ESSENTIAL_KEYS.has(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage blocked: nothing was saved there anyway.
  }
};

/** Records the choice: accepting saves what waited in memory, declining wipes what was saved. */
export const applyStorageConsent = (consent: StorageConsent) => {
  write(STORAGE_CONSENT_KEY, consent);
  accepted = consent === 'accepted';

  if (accepted) {
    pending.forEach((value, key) => write(key, value));
  } else {
    removeSavedPreferences();
  }

  pending.clear();
};
