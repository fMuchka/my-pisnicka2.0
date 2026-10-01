import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Cookie } from 'lucide-vue-next';
import IconBackdrop from './IconBackdrop.vue';

const meta = {
  title: 'Core/IconBackdrop',
  component: IconBackdrop,
  tags: ['autodocs'],
  argTypes: {
    shape: {
      control: 'select',
      options: ['circle', 'rounded'],
    },
    size: {
      control: 'select',
      options: ['md', 'lg'],
    },
  },
  args: {
    shape: 'circle',
    size: 'md',
  },
  render: (args) => ({
    components: { IconBackdrop, Cookie },
    setup() {
      return { args };
    },
    template: `
      <IconBackdrop v-bind="args">
        <Cookie :size="args.size === 'lg' ? 22 : 20" aria-hidden="true" />
      </IconBackdrop>
    `,
  }),
} satisfies Meta<typeof IconBackdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

// 32px circle — the cookie-consent card's badge, and the song icon in the
// Nastavení "Náhled" preview card.
export const Circle: Story = {};

// 40px rounded square — the Domů screen's nav tile icons (Písně, Relace, …).
export const Rounded: Story = {
  args: {
    shape: 'rounded',
    size: 'lg',
  },
};

export const AllVariations: Story = {
  render: () => ({
    components: { IconBackdrop, Cookie },
    template: `
      <div style="display: flex; gap: 24px; align-items: center;">
        <IconBackdrop shape="circle" size="md">
          <Cookie :size="20" aria-hidden="true" />
        </IconBackdrop>
        <IconBackdrop shape="rounded" size="lg">
          <Cookie :size="22" aria-hidden="true" />
        </IconBackdrop>
      </div>
    `,
  }),
};
