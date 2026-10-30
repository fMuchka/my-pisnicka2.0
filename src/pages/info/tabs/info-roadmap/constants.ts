import { List, Music, Sparkles, Users } from 'lucide-react';
import type { Icon } from '../../../../components/_core/types';
import type { FeatureArea } from '../../../../lib/upcoming-features/upcomingFeatures';

export const AREA_ICONS: Record<FeatureArea, Icon> = {
  relace: Users,
  pisne: Music,
  seznamy: List,
};

/** For features without an area, grouped under "Ostatní". */
export const OTHER_AREA_ICON: Icon = Sparkles;

export const RECENTLY_DONE_LIMIT = 2;
