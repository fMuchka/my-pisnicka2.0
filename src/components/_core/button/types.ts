import type { LucideProps } from 'lucide-vue-next';
import type { EmitsOptions, FunctionalComponent } from 'vue';

export type ButtonIconPosition = 'prepend' | 'append';
export type ButtonRoleVariation = 'primary' | 'secondary';
export type ButtonStyleVariation = 'filled' | 'outlined' | 'text';
export type ButtonIcon = {
  position: ButtonIconPosition;
  component: FunctionalComponent<
    LucideProps,
    Record<string, unknown[]>,
    Record<string, unknown>,
    EmitsOptions
  >;
  props?: LucideProps;
};
