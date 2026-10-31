import { HomeIcon, Users, Info, Music, Settings } from 'lucide-react';
import type { AppBarPage } from './app-bar/types';
import Routes from '../../router/Routes';

const home: AppBarPage = {
  icon: HomeIcon,
  label: 'Domů',
  link: Routes.Home,
  id: 'home',
};
export const sessions: AppBarPage = {
  icon: Users,
  label: 'Relace',
  link: Routes.SessionList,
  id: 'session',
};
const info: AppBarPage = {
  icon: Info,
  label: 'Info',
  link: Routes.Info,
  id: 'info',
};
const songs: AppBarPage = {
  icon: Music,
  label: 'Písně',
  link: Routes.SongLibrary,
  id: 'music',
};
const settings: AppBarPage = {
  icon: Settings,
  label: 'Nastavení',
  link: Routes.Settings,
  id: 'settings',
};

export const mainPage = songs;
export const tabPages = [home, sessions, info, settings];
export const menuPages = [home, songs, sessions, info, settings];
