import type { PresetOption, ThemeOption } from './types';

export const themeOptions: ThemeOption[] = [
  { value: 'dark', label: 'Tmavý', description: 'Pro hraní za tmy' },
  { value: 'light', label: 'Světlý', description: 'Pro denní hraní' },
];

export const presetOptions: PresetOption[] = [
  { value: 'red', label: 'Klasika' },
  { value: 'orange', label: 'Slunečnice' },
  { value: 'green', label: 'Les' },
  { value: 'teal', label: 'Oceán' },
  { value: 'blue', label: 'Nebe' },
  { value: 'purple', label: 'Levandule' },
];
