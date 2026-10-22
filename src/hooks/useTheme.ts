import { create } from 'zustand';
import type { Instrument } from '../lib/chords/chords.database';

export type Theme = 'light' | 'dark';

export const COLOR_PRESETS = ['red', 'orange', 'green', 'teal', 'blue', 'purple'] as const;
export type ColorPreset = (typeof COLOR_PRESETS)[number];

const THEME_STORAGE_KEY = 'my-pisnicka:theme';
const INSTRUMENT_STORAGE_KEY = 'my-pisnicka:instrument';
const COLOR_PRESET_STORAGE_KEY = 'my-pisnicka:color-preset';
const CHORD_STORAGE_KEY = 'my-pisnicka:chord-color';
const LYRICS_FONT_SIZE_STORAGE_KEY = 'my-pisnicka:lyrics-font-size';
const CHORD_FONT_SIZE_STORAGE_KEY = 'my-pisnicka:chord-font-size';
const DEFAULT_THEME: Theme = 'light';
const DEFAULT_INSTRUMENT: Instrument = 'guitar';
const DEFAULT_COLOR_PRESET: ColorPreset = 'red';
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;
const DEFAULT_LYRICS_FONT_SIZE = 18;
const DEFAULT_CHORD_FONT_SIZE = 16;
const DEFAULT_CHORD_BY_THEME: Record<Theme, string> = {
  light: '#292524',
  dark: '#e7e5e4',
};

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';
const isInstrument = (value: string | null): value is Instrument =>
  value === 'guitar' || value === 'ukulele';
const isColorPreset = (value: string | null): value is ColorPreset =>
  COLOR_PRESETS.some((preset) => preset === value); // NOSONAR: Some makes more sense here than includes due to guard typecheck
const isHexColor = (value: string | null): value is string =>
  value != null && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(value);
const isValidFontSize = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= MIN_FONT_SIZE &&
  value <= MAX_FONT_SIZE;

const normalizeHexColor = (value: string) => {
  const hex = value.replace('#', '').trim();

  if (hex.length === 3) {
    return `#${hex
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`.toLowerCase();
  }

  return `#${hex}`.toLowerCase();
};

export const getContrastTextColor = (backgroundHex: string): '#000000' | '#ffffff' => {
  const normalized = normalizeHexColor(backgroundHex);
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;

  const toLinear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  const luminance = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

  return luminance > 0.179 ? '#000000' : '#ffffff';
};

const resolvePreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (isTheme(storedTheme)) {
    return storedTheme;
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const applyTheme = (nextTheme: Theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = nextTheme;
};

const applyColorPreset = (nextPreset: ColorPreset) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.color = nextPreset;
};

const readChordToken = (): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return DEFAULT_CHORD_BY_THEME[DEFAULT_THEME];
  }

  return getComputedStyle(document.documentElement).getPropertyValue('--text-chord').trim();
};

const readFontSizeToken = (
  token: '--font-size-lyrics' | '--font-size-chords',
  fallback: number
): number => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const numericValue = Number.parseFloat(rawValue);

  return isValidFontSize(numericValue) ? numericValue : fallback;
};

type CustomColors = { chordColor: string; lyricsFontSize: number; chordFontSize: number };

const applyCustomColors = ({ chordColor, lyricsFontSize, chordFontSize }: CustomColors) => {
  if (typeof document === 'undefined') {
    return;
  }

  const chordContrastColor = getContrastTextColor(chordColor);

  // Older components still read these instead of --brand; point them at the chosen preset.
  document.documentElement.style.setProperty('--accent', 'var(--brand)');
  document.documentElement.style.setProperty('--accent-light', 'var(--brand)');
  document.documentElement.style.setProperty('--color-primary', 'var(--brand)');
  document.documentElement.style.setProperty('--song-chord-inline-bg', chordColor);
  document.documentElement.style.setProperty('--song-chord-inline-color', chordContrastColor);
  document.documentElement.style.setProperty('--chord-icon-contrast', chordContrastColor);
  document.documentElement.style.setProperty('--font-size-lyrics', `${lyricsFontSize}px`);
  document.documentElement.style.setProperty('--font-size-chords', `${chordFontSize}px`);
};

const readInitialPreferences = () => {
  const theme = resolvePreferredTheme();
  // Applied before the rest is read: the CSS fallbacks below depend on the active theme.
  applyTheme(theme);

  const storedPreset = localStorage.getItem(COLOR_PRESET_STORAGE_KEY);
  const storedChord = localStorage.getItem(CHORD_STORAGE_KEY);
  const storedInstrument = localStorage.getItem(INSTRUMENT_STORAGE_KEY);
  const storedLyricsSize = Number.parseFloat(
    localStorage.getItem(LYRICS_FONT_SIZE_STORAGE_KEY) ?? ''
  );
  const storedChordSize = Number.parseFloat(
    localStorage.getItem(CHORD_FONT_SIZE_STORAGE_KEY) ?? ''
  );

  const preferences = {
    theme,
    colorPreset: isColorPreset(storedPreset) ? storedPreset : DEFAULT_COLOR_PRESET,
    chordColor: isHexColor(storedChord) ? storedChord : readChordToken(),
    preferredInstrument: isInstrument(storedInstrument) ? storedInstrument : DEFAULT_INSTRUMENT,
    lyricsFontSize: isValidFontSize(storedLyricsSize)
      ? storedLyricsSize
      : readFontSizeToken('--font-size-lyrics', DEFAULT_LYRICS_FONT_SIZE),
    chordFontSize: isValidFontSize(storedChordSize)
      ? storedChordSize
      : readFontSizeToken('--font-size-chords', DEFAULT_CHORD_FONT_SIZE),
  };

  applyColorPreset(preferences.colorPreset);
  applyCustomColors(preferences);

  return preferences;
};

type ThemeState = {
  theme: Theme;
  preferredInstrument: Instrument;
  colorPreset: ColorPreset;
  chordColor: string;
  lyricsFontSize: number;
  chordFontSize: number;
  setTheme: (nextTheme: Theme) => void;
  setPreferredInstrument: (nextInstrument: Instrument) => void;
  setColorPreset: (nextPreset: ColorPreset) => void;
  setChordColor: (nextColor: string) => void;
  setLyricsFontSize: (nextSize: number) => void;
  setChordFontSize: (nextSize: number) => void;
  resetToDefaults: () => void;
};

/**
 * Theme and reading preferences, persisted to localStorage and mirrored onto <html>.
 * Created on import, so the saved theme is applied before the first render.
 *
 * In components: `const theme = useTheme((s) => s.theme)`. Outside React: `useTheme.getState()`.
 */
export const useTheme = create<ThemeState>()((set, get) => ({
  ...readInitialPreferences(),

  setTheme: (nextTheme) => {
    set({ theme: nextTheme });
    applyTheme(nextTheme);
    applyCustomColors(get());
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  },

  setColorPreset: (nextPreset) => {
    set({ colorPreset: nextPreset });
    applyColorPreset(nextPreset);
    localStorage.setItem(COLOR_PRESET_STORAGE_KEY, nextPreset);
  },

  setPreferredInstrument: (nextInstrument) => {
    set({ preferredInstrument: nextInstrument });
    localStorage.setItem(INSTRUMENT_STORAGE_KEY, nextInstrument);
  },

  setChordColor: (nextColor) => {
    if (!isHexColor(nextColor)) {
      return;
    }

    set({ chordColor: nextColor });
    applyCustomColors(get());
    localStorage.setItem(CHORD_STORAGE_KEY, nextColor);
  },

  setLyricsFontSize: (nextSize) => {
    if (!isValidFontSize(nextSize)) {
      return;
    }

    const lyricsFontSize = Math.round(nextSize);
    set({ lyricsFontSize });
    applyCustomColors(get());
    localStorage.setItem(LYRICS_FONT_SIZE_STORAGE_KEY, String(lyricsFontSize));
  },

  setChordFontSize: (nextSize) => {
    if (!isValidFontSize(nextSize)) {
      return;
    }

    const chordFontSize = Math.round(nextSize);
    set({ chordFontSize });
    applyCustomColors(get());
    localStorage.setItem(CHORD_FONT_SIZE_STORAGE_KEY, String(chordFontSize));
  },

  resetToDefaults: () => {
    set({
      colorPreset: DEFAULT_COLOR_PRESET,
      chordColor: DEFAULT_CHORD_BY_THEME[DEFAULT_THEME],
      preferredInstrument: DEFAULT_INSTRUMENT,
      lyricsFontSize: DEFAULT_LYRICS_FONT_SIZE,
      chordFontSize: DEFAULT_CHORD_FONT_SIZE,
    });
    applyColorPreset(DEFAULT_COLOR_PRESET);
    applyCustomColors(get());

    localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
    localStorage.setItem(INSTRUMENT_STORAGE_KEY, DEFAULT_INSTRUMENT);
    localStorage.removeItem(COLOR_PRESET_STORAGE_KEY);
    localStorage.removeItem(CHORD_STORAGE_KEY);
    localStorage.removeItem(LYRICS_FONT_SIZE_STORAGE_KEY);
    localStorage.removeItem(CHORD_FONT_SIZE_STORAGE_KEY);
  },
}));
