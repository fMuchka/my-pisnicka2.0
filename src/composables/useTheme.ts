import { computed, ref } from 'vue';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'my-pisnicka:theme';
const ACCENT_STORAGE_KEY = 'my-pisnicka:accent-color';
const CHORD_STORAGE_KEY = 'my-pisnicka:chord-color';
const LYRICS_FONT_SIZE_STORAGE_KEY = 'my-pisnicka:lyrics-font-size';
const CHORD_FONT_SIZE_STORAGE_KEY = 'my-pisnicka:chord-font-size';
const DEFAULT_THEME: Theme = 'light';
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;
const DEFAULT_LYRICS_FONT_SIZE = 18;
const DEFAULT_CHORD_FONT_SIZE = 16;
const DEFAULT_ACCENT_BY_THEME: Record<Theme, string> = {
  light: '#dc2626',
  dark: '#ef4444',
};
const DEFAULT_CHORD_BY_THEME: Record<Theme, string> = {
  light: '#292524',
  dark: '#e7e5e4',
};
const theme = ref<Theme>('light');
const accentColor = ref('#dc2626');
const chordColor = ref('#292524');
const lyricsFontSize = ref(DEFAULT_LYRICS_FONT_SIZE);
const chordFontSize = ref(DEFAULT_CHORD_FONT_SIZE);
let isInitialized = false;

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';
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
  const red = parseInt(normalized.slice(1, 3), 16) / 255;
  const green = parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = parseInt(normalized.slice(5, 7), 16) / 255;

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

  document.documentElement.setAttribute('data-theme', nextTheme);
};

const readThemeToken = (token: '--accent' | '--text-chord'): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return token === '--accent'
      ? DEFAULT_ACCENT_BY_THEME[DEFAULT_THEME]
      : DEFAULT_CHORD_BY_THEME[DEFAULT_THEME];
  }

  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
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

const applyCustomColors = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const chordContrastColor = getContrastTextColor(chordColor.value);

  document.documentElement.style.setProperty('--accent', accentColor.value);
  document.documentElement.style.setProperty('--accent-light', accentColor.value);
  document.documentElement.style.setProperty('--color-primary', accentColor.value);
  document.documentElement.style.setProperty('--song-chord-inline-bg', chordColor.value);
  document.documentElement.style.setProperty('--song-chord-inline-color', chordContrastColor);
  document.documentElement.style.setProperty('--chord-icon-contrast', chordContrastColor);
  document.documentElement.style.setProperty('--font-size-lyrics', `${lyricsFontSize.value}px`);
  document.documentElement.style.setProperty('--font-size-chords', `${chordFontSize.value}px`);
};

const initializeTheme = () => {
  if (isInitialized) {
    return;
  }

  const initialTheme = resolvePreferredTheme();
  theme.value = initialTheme;
  applyTheme(initialTheme);

  const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
  const storedChord = localStorage.getItem(CHORD_STORAGE_KEY);
  const storedLyricsSize = Number.parseFloat(
    localStorage.getItem(LYRICS_FONT_SIZE_STORAGE_KEY) ?? ''
  );
  const storedChordSize = Number.parseFloat(
    localStorage.getItem(CHORD_FONT_SIZE_STORAGE_KEY) ?? ''
  );

  accentColor.value = isHexColor(storedAccent) ? storedAccent : readThemeToken('--accent');
  chordColor.value = isHexColor(storedChord) ? storedChord : readThemeToken('--text-chord');
  lyricsFontSize.value = isValidFontSize(storedLyricsSize)
    ? storedLyricsSize
    : readFontSizeToken('--font-size-lyrics', DEFAULT_LYRICS_FONT_SIZE);
  chordFontSize.value = isValidFontSize(storedChordSize)
    ? storedChordSize
    : readFontSizeToken('--font-size-chords', DEFAULT_CHORD_FONT_SIZE);

  applyCustomColors();
  isInitialized = true;
};

export const useTheme = () => {
  initializeTheme();

  const setTheme = (nextTheme: Theme) => {
    theme.value = nextTheme;
    applyTheme(nextTheme);
    applyCustomColors();

    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
  };

  const setAccentColor = (nextColor: string) => {
    if (!isHexColor(nextColor)) {
      return;
    }

    accentColor.value = nextColor;
    applyCustomColors();

    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCENT_STORAGE_KEY, nextColor);
    }
  };

  const setChordColor = (nextColor: string) => {
    if (!isHexColor(nextColor)) {
      return;
    }

    chordColor.value = nextColor;
    applyCustomColors();

    if (typeof window !== 'undefined') {
      localStorage.setItem(CHORD_STORAGE_KEY, nextColor);
    }
  };

  const setLyricsFontSize = (nextSize: number) => {
    if (!isValidFontSize(nextSize)) {
      return;
    }

    lyricsFontSize.value = Math.round(nextSize);
    applyCustomColors();

    if (typeof window !== 'undefined') {
      localStorage.setItem(LYRICS_FONT_SIZE_STORAGE_KEY, String(lyricsFontSize.value));
    }
  };

  const setChordFontSize = (nextSize: number) => {
    if (!isValidFontSize(nextSize)) {
      return;
    }

    chordFontSize.value = Math.round(nextSize);
    applyCustomColors();

    if (typeof window !== 'undefined') {
      localStorage.setItem(CHORD_FONT_SIZE_STORAGE_KEY, String(chordFontSize.value));
    }
  };

  const resetToDefaults = () => {
    accentColor.value = DEFAULT_ACCENT_BY_THEME[DEFAULT_THEME];
    chordColor.value = DEFAULT_CHORD_BY_THEME[DEFAULT_THEME];
    lyricsFontSize.value = DEFAULT_LYRICS_FONT_SIZE;
    chordFontSize.value = DEFAULT_CHORD_FONT_SIZE;

    applyCustomColors();

    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
      localStorage.removeItem(ACCENT_STORAGE_KEY);
      localStorage.removeItem(CHORD_STORAGE_KEY);
      localStorage.removeItem(LYRICS_FONT_SIZE_STORAGE_KEY);
      localStorage.removeItem(CHORD_FONT_SIZE_STORAGE_KEY);
    }
  };

  return {
    theme,
    accentColor,
    chordColor,
    lyricsFontSize,
    chordFontSize,
    setTheme,
    setAccentColor,
    setChordColor,
    setLyricsFontSize,
    setChordFontSize,
    resetToDefaults,
    isDarkTheme: computed(() => theme.value === 'dark'),
  };
};
