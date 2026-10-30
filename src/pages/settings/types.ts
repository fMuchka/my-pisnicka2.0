import type { ColorPreset, Theme } from '../../hooks/useTheme';

export type ThemeOption = {
  value: Theme;
  label: string;
  description: string;
};

export type PresetOption = {
  value: ColorPreset;
  label: string;
};
