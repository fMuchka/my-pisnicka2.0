import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { HomeIcon, Info, Music, Users } from 'lucide-vue-next';
import type { TabBarPage } from '../tab-bar/TabBar.vue';
import SideMenu from './SideMenu.vue';

const pages: TabBarPage[] = [
  { icon: { component: HomeIcon }, label: 'Domů', link: '/', id: 'home' },
  { icon: { component: Music }, label: 'Písně', link: '/songs', id: 'music' },
  { icon: { component: Users }, label: 'Relace', link: '/sessionList', id: 'session' },
  { icon: { component: Info }, label: 'Info', link: '/info', id: 'info' },
];

const meta = {
  title: 'Navigation/SideMenu',
  component: SideMenu,
  tags: ['autodocs'],
  argTypes: {
    currentPageId: {
      control: 'select',
      options: pages.map((p) => p.id),
    },
  },
  args: {
    pages,
    currentPageId: 'home',
  },
} satisfies Meta<typeof SideMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SessionActive: Story = {
  args: {
    currentPageId: 'session',
  },
};
