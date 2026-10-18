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

// The store reads preferences when the module loads, so each case needs a fresh import.
const loadTheme = async () => {
  vi.resetModules();
  setupMatchMedia();
  const { useTheme }: UseThemeModule = await import('../useTheme');
  return useTheme;
};

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.cssText = '';
    vi.unstubAllGlobals();
  });

  it('applies default font-size tokens during initialization', async () => {
    const state = (await loadTheme()).getState();

    expect(state.lyricsFontSize).toBe(18);
    expect(state.chordFontSize).toBe(16);
    expect(document.documentElement.style.getPropertyValue('--font-size-lyrics').trim()).toBe(
      '18px'
    );
    expect(document.documentElement.style.getPropertyValue('--font-size-chords').trim()).toBe(
      '16px'
    );
  });

  it('updates font size values, css variables, and localStorage when setters are called', async () => {
    const useTheme = await loadTheme();

    useTheme.getState().setLyricsFontSize(23);
    useTheme.getState().setChordFontSize(14);

    expect(useTheme.getState().lyricsFontSize).toBe(23);
    expect(useTheme.getState().chordFontSize).toBe(14);
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
    const useTheme = await loadTheme();

    useTheme.getState().setLyricsFontSize(11);
    useTheme.getState().setChordFontSize(99);

    expect(useTheme.getState().lyricsFontSize).toBe(18);
    expect(useTheme.getState().chordFontSize).toBe(16);
    expect(localStorage.getItem('my-pisnicka:lyrics-font-size')).toBeNull();
    expect(localStorage.getItem('my-pisnicka:chord-font-size')).toBeNull();
  });

  it('reads persisted font sizes from localStorage on first load', async () => {
    localStorage.setItem('my-pisnicka:lyrics-font-size', '20');
    localStorage.setItem('my-pisnicka:chord-font-size', '17');

    const state = (await loadTheme()).getState();

    expect(state.lyricsFontSize).toBe(20);
    expect(state.chordFontSize).toBe(17);
    expect(document.documentElement.style.getPropertyValue('--font-size-lyrics').trim()).toBe(
      '20px'
    );
    expect(document.documentElement.style.getPropertyValue('--font-size-chords').trim()).toBe(
      '17px'
    );
  });

  it('defaults preferred instrument to guitar and persists manual changes', async () => {
    const useTheme = await loadTheme();

    expect(useTheme.getState().preferredInstrument).toBe('guitar');

    useTheme.getState().setPreferredInstrument('ukulele');

    expect(useTheme.getState().preferredInstrument).toBe('ukulele');
    expect(localStorage.getItem('my-pisnicka:instrument')).toBe('ukulele');
  });

  it('reads persisted preferred instrument on first load', async () => {
    localStorage.setItem('my-pisnicka:instrument', 'ukulele');

    const state = (await loadTheme()).getState();

    expect(state.preferredInstrument).toBe('ukulele');
  });

  it('defaults to the red color preset and persists manual changes', async () => {
    const useTheme = await loadTheme();

    expect(useTheme.getState().colorPreset).toBe('red');
    expect(document.documentElement.getAttribute('data-color')).toBe('red');

    useTheme.getState().setColorPreset('teal');

    expect(useTheme.getState().colorPreset).toBe('teal');
    expect(document.documentElement.getAttribute('data-color')).toBe('teal');
    expect(localStorage.getItem('my-pisnicka:color-preset')).toBe('teal');
  });

  it('reads a persisted color preset and ignores unknown ones', async () => {
    localStorage.setItem('my-pisnicka:color-preset', 'blue');
    expect((await loadTheme()).getState().colorPreset).toBe('blue');

    localStorage.setItem('my-pisnicka:color-preset', 'magenta');
    expect((await loadTheme()).getState().colorPreset).toBe('red');
  });

  it('resetToDefaults clears persisted size preferences and restores default tokens', async () => {
    const useTheme = await loadTheme();

    useTheme.getState().setLyricsFontSize(24);
    useTheme.getState().setChordFontSize(13);
    useTheme.getState().setPreferredInstrument('ukulele');

    useTheme.getState().resetToDefaults();

    expect(useTheme.getState().lyricsFontSize).toBe(18);
    expect(useTheme.getState().chordFontSize).toBe(16);
    expect(document.documentElement.style.getPropertyValue('--font-size-lyrics').trim()).toBe(
      '18px'
    );
    expect(document.documentElement.style.getPropertyValue('--font-size-chords').trim()).toBe(
      '16px'
    );
    expect(useTheme.getState().preferredInstrument).toBe('guitar');
    expect(localStorage.getItem('my-pisnicka:instrument')).toBe('guitar');
    expect(localStorage.getItem('my-pisnicka:lyrics-font-size')).toBeNull();
    expect(localStorage.getItem('my-pisnicka:chord-font-size')).toBeNull();
  });
});
