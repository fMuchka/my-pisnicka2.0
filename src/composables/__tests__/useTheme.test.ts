import { beforeEach, describe, expect, it, vi } from 'vitest';

type UseThemeModule = typeof import('../useTheme');

const setupMatchMedia = () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
};

const loadUseThemeModule = async (): Promise<UseThemeModule> => {
  vi.resetModules();
  setupMatchMedia();
  return import('../useTheme');
};

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.cssText = '';
    vi.unstubAllGlobals();
  });

  it('applies default font-size tokens during initialization', async () => {
    const { useTheme } = await loadUseThemeModule();

    const state = useTheme();

    expect(state.lyricsFontSize.value).toBe(18);
    expect(state.chordFontSize.value).toBe(16);
    expect(document.documentElement.style.getPropertyValue('--font-size-lyrics').trim()).toBe(
      '18px'
    );
    expect(document.documentElement.style.getPropertyValue('--font-size-chords').trim()).toBe(
      '16px'
    );
  });

  it('updates font size values, css variables, and localStorage when setters are called', async () => {
    const { useTheme } = await loadUseThemeModule();

    const state = useTheme();
    state.setLyricsFontSize(23);
    state.setChordFontSize(14);

    expect(state.lyricsFontSize.value).toBe(23);
    expect(state.chordFontSize.value).toBe(14);
    expect(document.documentElement.style.getPropertyValue('--font-size-lyrics').trim()).toBe(
      '23px'
    );
    expect(document.documentElement.style.getPropertyValue('--font-size-chords').trim()).toBe(
      '14px'
    );
    expect(localStorage.getItem('my-pisnicka:lyrics-font-size')).toBe('23');
    expect(localStorage.getItem('my-pisnicka:chord-font-size')).toBe('14');
  });

  it('ignores invalid font sizes outside supported range', async () => {
    const { useTheme } = await loadUseThemeModule();

    const state = useTheme();
    state.setLyricsFontSize(11);
    state.setChordFontSize(99);

    expect(state.lyricsFontSize.value).toBe(18);
    expect(state.chordFontSize.value).toBe(16);
    expect(localStorage.getItem('my-pisnicka:lyrics-font-size')).toBeNull();
    expect(localStorage.getItem('my-pisnicka:chord-font-size')).toBeNull();
  });

  it('reads persisted font sizes from localStorage on first load', async () => {
    localStorage.setItem('my-pisnicka:lyrics-font-size', '20');
    localStorage.setItem('my-pisnicka:chord-font-size', '17');

    const { useTheme } = await loadUseThemeModule();

    const state = useTheme();

    expect(state.lyricsFontSize.value).toBe(20);
    expect(state.chordFontSize.value).toBe(17);
    expect(document.documentElement.style.getPropertyValue('--font-size-lyrics').trim()).toBe(
      '20px'
    );
    expect(document.documentElement.style.getPropertyValue('--font-size-chords').trim()).toBe(
      '17px'
    );
  });

  it('resetToDefaults clears persisted size preferences and restores default tokens', async () => {
    const { useTheme } = await loadUseThemeModule();

    const state = useTheme();
    state.setLyricsFontSize(24);
    state.setChordFontSize(13);

    state.resetToDefaults();

    expect(state.lyricsFontSize.value).toBe(18);
    expect(state.chordFontSize.value).toBe(16);
    expect(document.documentElement.style.getPropertyValue('--font-size-lyrics').trim()).toBe(
      '18px'
    );
    expect(document.documentElement.style.getPropertyValue('--font-size-chords').trim()).toBe(
      '16px'
    );
    expect(localStorage.getItem('my-pisnicka:lyrics-font-size')).toBeNull();
    expect(localStorage.getItem('my-pisnicka:chord-font-size')).toBeNull();
  });
});
