import { beforeEach, describe, expect, it, vi } from 'vitest';

const CONSENT_KEY = 'my-pisnicka:cookie-notice-consent';
const THEME_KEY = 'my-pisnicka:theme';

// The module reads the consent once on import, so each test starts from a fresh copy.
const loadStorage = async (consent?: 'accepted' | 'declined') => {
  if (consent) localStorage.setItem(CONSENT_KEY, consent);
  vi.resetModules();
  return import('../preferenceStorage');
};

describe('preferenceStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves straight away once accepted', async () => {
    const storage = await loadStorage('accepted');

    storage.setPreferenceItem(THEME_KEY, 'dark');

    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('keeps preferences in memory until the user decides', async () => {
    const storage = await loadStorage();
    expect(storage.readStorageConsent()).toBeNull();

    storage.setPreferenceItem(THEME_KEY, 'dark');

    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    expect(storage.getPreferenceItem(THEME_KEY)).toBe('dark');
  });

  it('saves what waited in memory when accepted', async () => {
    const storage = await loadStorage();
    storage.setPreferenceItem(THEME_KEY, 'dark');
    storage.removePreferenceItem('my-pisnicka:chord-color');
    localStorage.setItem('my-pisnicka:chord-color', '#000000');

    storage.applyStorageConsent('accepted');

    expect(localStorage.getItem(CONSENT_KEY)).toBe('accepted');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(localStorage.getItem('my-pisnicka:chord-color')).toBeNull();
  });

  it('wipes saved preferences but keeps essential data when declined', async () => {
    const storage = await loadStorage('accepted');
    storage.setPreferenceItem(THEME_KEY, 'dark');
    localStorage.setItem('my-pisnicka:feature-preferences', '{}');
    // The song cache timestamp has no app prefix: it's essential and stays.
    localStorage.setItem('mypisnicka_cache_ts', '123');

    storage.applyStorageConsent('declined');

    expect(localStorage.getItem(CONSENT_KEY)).toBe('declined');
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    expect(localStorage.getItem('my-pisnicka:feature-preferences')).toBeNull();
    expect(localStorage.getItem('mypisnicka_cache_ts')).toBe('123');
  });

  it('keeps later changes in memory only after declining', async () => {
    const storage = await loadStorage('declined');

    storage.setPreferenceItem(THEME_KEY, 'dark');

    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    expect(storage.getPreferenceItem(THEME_KEY)).toBe('dark');
  });
});
