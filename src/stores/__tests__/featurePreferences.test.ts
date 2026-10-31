import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'my-pisnicka:feature-preferences';

// The store reads storage once, on import, so each test imports a fresh copy.
const loadStore = async () => {
  vi.resetModules();
  return import('../featurePreferences');
};

describe('featurePreferences store', () => {
  beforeEach(() => {
    localStorage.clear();
    // Each test re-imports the storage layer, which reads the consent again.
    localStorage.setItem('my-pisnicka:cookie-notice-consent', 'accepted');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with every feature on', async () => {
    const { useFeaturePreferences, DEFAULT_FEATURE_PREFERENCES } = await loadStore();

    expect(useFeaturePreferences.getState()).toMatchObject(DEFAULT_FEATURE_PREFERENCES);
    expect(Object.values(DEFAULT_FEATURE_PREFERENCES).every(Boolean)).toBe(true);
  });

  it('saves a change and reads it back on the next load', async () => {
    const first = await loadStore();
    first.useFeaturePreferences.getState().setPreference('keepScreenAwake', false);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      timeLeftVisible: true,
      tapToToggleScroll: true,
      keepScreenAwake: false,
      allowManualScroll: true,
    });

    const second = await loadStore();
    expect(second.useFeaturePreferences.getState().keepScreenAwake).toBe(false);
  });

  it('keeps the defaults for anything missing or malformed in storage', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tapToToggleScroll: false, allowManualScroll: 'nope', stale: false })
    );
    const { useFeaturePreferences } = await loadStore();
    const state = useFeaturePreferences.getState();

    expect(state.tapToToggleScroll).toBe(false);
    expect(state.allowManualScroll).toBe(true);
    expect(state.timeLeftVisible).toBe(true);
    expect(state).not.toHaveProperty('stale');
  });

  it('falls back to the defaults when storage is garbled or blocked', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect((await loadStore()).useFeaturePreferences.getState().timeLeftVisible).toBe(true);

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { useFeaturePreferences } = await loadStore();

    useFeaturePreferences.getState().setPreference('timeLeftVisible', false);
    expect(useFeaturePreferences.getState().timeLeftVisible).toBe(false);
  });
});
