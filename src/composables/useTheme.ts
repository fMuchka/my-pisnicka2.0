import { computed, ref } from 'vue';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'my-pisnicka:theme';
const theme = ref<Theme>('light');
let isInitialized = false;

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

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

const initializeTheme = () => {
  if (isInitialized) {
    return;
  }

  const initialTheme = resolvePreferredTheme();
  theme.value = initialTheme;
  applyTheme(initialTheme);
  isInitialized = true;
};

export const useTheme = () => {
  initializeTheme();

  const setTheme = (nextTheme: Theme) => {
    theme.value = nextTheme;
    applyTheme(nextTheme);

    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
  };

  return {
    theme,
    setTheme,
    isDarkTheme: computed(() => theme.value === 'dark'),
  };
};
