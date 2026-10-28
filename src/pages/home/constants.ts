import { Music, Users, Info, Settings } from 'lucide-react';
import Routes from '../../router/Routes';
import type { HomeTile } from './types';

// If we don't know the email, most likely guest user
export const PLACEHOLDER_USER_NAME = 'Melon';

export const tiles: HomeTile[] = [
  { label: 'Písně', meta: 'Procvičování', icon: Music, route: Routes.SongLibrary },
  { label: 'Relace', meta: 'Společné hraní', icon: Users, route: Routes.SessionList },
  {
    label: 'Informace',
    meta: 'Co bylo, je a bude',
    icon: Info,
    route: Routes.Info,
  },
  { label: 'Nastavení', meta: 'Vzhled a motiv', icon: Settings, route: Routes.Settings },
] as const;
