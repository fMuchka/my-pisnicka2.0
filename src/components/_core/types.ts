import type { LucideIcon, LucideProps } from 'lucide-react';

/** A lucide icon plus the props to render it with, for components that draw the icon themselves. */
export type IconSpec = {
  component: LucideIcon;
  props?: LucideProps;
};

/** Maps each variant to its CSS module class (module lookups are typed `string | undefined`). */
export type VariantClassMap<T extends string> = Record<T, string | undefined>;
