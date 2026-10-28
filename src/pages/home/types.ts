import type { LucideIcon } from 'lucide-react';
import type Routes from '../../router/Routes';

export type HomeTile = {
  label: string;
  meta: string;
  icon: LucideIcon;
  route: Routes;
};
