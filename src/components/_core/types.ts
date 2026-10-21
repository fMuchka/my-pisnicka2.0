import type { LucideIcon } from 'lucide-react';

/** Maps each variant to its CSS module class (module lookups are typed `string | undefined`). */
export type VariantClassMap<T extends string> = Record<T, string | undefined>;

export type Icon = LucideIcon;
