import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { HomeIcon, List, Music, User, Users } from 'lucide-vue-next';
import TabBar, { type TabBarPage } from './TabBar.vue';

const home: TabBarPage = { icon: { component: HomeIcon }, label: 'Domů', link: '/', id: 'home' };
const playlists: TabBarPage = {
  icon: { component: List },
  label: 'Playlisty',
  link: '/playlists',
  id: 'playlist',
};
const sessions: TabBarPage = {
  icon: { component: Users },
  label: 'Relace',
  link: '/sessionList',
  id: 'session',
};
const account: TabBarPage = {
  icon: { component: User },
  label: 'Účet',
  link: '/account',
  id: 'user',
};

const pages = [home, playlists, sessions, account];

const mainPage: TabBarPage = {
  icon: { component: Music },
  label: 'Písně',
  link: '/songs',
  id: 'music',
};

const meta = {
  title: 'Core/TabBar',
  component: TabBar,
  tags: ['autodocs'],
  argTypes: {
    currentPageId: {
      control: 'select',
      options: [...pages, mainPage].map((p) => p.id),
    },
  },
  args: {
    pages,
    mainPage,
    currentPageId: 'home',
  },
  // The main circle sticks out above the bar, so give it room instead of clipping it.
  decorators: [() => ({ template: '<div style="padding-top: 48px;"><story /></div>' })],
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RightSideActive: Story = {
  args: {
    currentPageId: 'session',
  },
};

export const MainPageActive: Story = {
  args: {
    currentPageId: 'music',
  },
};

export const OddPageCount: Story = {
  args: {
    pages: [home, playlists, sessions],
  },
};

export const TwoPages: Story = {
  args: {
    pages: [home, account],
  },
};

export const NarrowScreen: Story = {
  decorators: [() => ({ template: '<div style="max-width: 320px;"><story /></div>' })],
};
