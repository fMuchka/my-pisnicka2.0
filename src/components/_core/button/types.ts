import type { IconSpec } from '../types';

export type ButtonIconPosition = 'prepend' | 'append';
export type ButtonRoleVariation = 'primary' | 'secondary';
export type ButtonStyleVariation = 'filled' | 'outlined' | 'text';
export type ButtonIcon = IconSpec & {
  position: ButtonIconPosition;
};
