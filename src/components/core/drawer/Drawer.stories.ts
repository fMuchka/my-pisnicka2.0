import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ListMusicIcon } from 'lucide-vue-next';
import { h, type FunctionalComponent } from 'vue';
import Drawer from './Drawer.vue';

const SampleContent: FunctionalComponent = () =>
  h(
    'p',
    { style: 'margin: 0; color: var(--ink-muted); font-size: 14px; line-height: 21px;' },
    'Obsah draweru se vykresluje sem.'
  );

const meta = {
  title: 'Core/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
  },
  args: {
    open: true,
    title: 'Filtry',
    titleIcon: { component: ListMusicIcon },
    content: SampleContent,
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: {
    open: false,
  },
};

export const WithoutIcon: Story = {
  args: {
    titleIcon: undefined,
  },
};

export const WithoutTitle: Story = {
  args: {
    title: '',
    titleIcon: undefined,
  },
};
