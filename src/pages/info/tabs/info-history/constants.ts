import { Plus, TrendingUp, Wrench } from 'lucide-react';
import type { Icon } from '../../../../components/_core/types';
import type { ChangeType } from '../../../../lib/timeline/timeline';

export const GROUP_ICONS: Record<ChangeType, Icon> = {
  new: Plus,
  improved: TrendingUp,
  fix: Wrench,
};
