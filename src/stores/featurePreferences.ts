import { create } from 'zustand';

export type FeaturePreferences = {
  /** Play mode: whether the "time left" line is shown. The arrow in the play controls changes it too. */
  timeLeftVisible: boolean;
  /** Play mode: a tap on the song text pauses or resumes the auto-scroll. */
  tapToToggleScroll: boolean;
  /** Play mode: keep the screen from turning off. */
  keepScreenAwake: boolean;
  /** Auto-scroll: the user can still scroll by hand while it runs. */
  allowManualScroll: boolean;
};

const FEATURE_PREFERENCES_STORAGE_KEY = 'my-pisnicka:feature-preferences';

export const DEFAULT_FEATURE_PREFERENCES: FeaturePreferences = {
  timeLeftVisible: true,
  tapToToggleScroll: true,
  keepScreenAwake: true,
  allowManualScroll: true,
};

const preferenceKeys = Object.keys(DEFAULT_FEATURE_PREFERENCES) as (keyof FeaturePreferences)[];

// Takes each known boolean from storage and the default for anything missing or malformed,
// so a preference added later starts at its default for everyone.
const readStoredPreferences = (): FeaturePreferences => {
  const preferences = { ...DEFAULT_FEATURE_PREFERENCES };

  try {
    const raw = localStorage.getItem(FEATURE_PREFERENCES_STORAGE_KEY);
    const stored: unknown = raw ? JSON.parse(raw) : null;
    if (typeof stored !== 'object' || stored === null) return preferences;

    for (const key of preferenceKeys) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value === 'boolean') preferences[key] = value;
    }
  } catch {
    // Storage blocked or garbled: start from the defaults.
  }

  return preferences;
};

const writeStoredPreferences = (preferences: FeaturePreferences) => {
  try {
    localStorage.setItem(FEATURE_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage blocked: the choice just lasts until the page is reloaded.
  }
};

type FeaturePreferencesState = FeaturePreferences & {
  setPreference: <K extends keyof FeaturePreferences>(key: K, value: FeaturePreferences[K]) => void;
};

const pickPreferences = (state: FeaturePreferencesState): FeaturePreferences =>
  Object.fromEntries(preferenceKeys.map((key) => [key, state[key]])) as FeaturePreferences;

/** The user's on/off choices for app features, remembered in localStorage. */
export const useFeaturePreferences = create<FeaturePreferencesState>()((set, get) => ({
  ...readStoredPreferences(),

  setPreference: (key, value) => {
    set({ [key]: value } as Partial<FeaturePreferences>);
    writeStoredPreferences(pickPreferences(get()));
  },
}));
