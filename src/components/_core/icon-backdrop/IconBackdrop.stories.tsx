import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cookie } from 'lucide-react';
import IconBackdrop from './IconBackdrop';

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
    children: null,
  },
  render: (args) => (
    <IconBackdrop {...args}>
      <Cookie
        size={args.size === 'lg' ? 22 : 20}
        aria-hidden="true"
      />
    </IconBackdrop>
  ),
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
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <IconBackdrop
        shape="circle"
        size="md"
      >
        <Cookie
          size={20}
          aria-hidden="true"
        />
      </IconBackdrop>
      <IconBackdrop
        shape="rounded"
        size="lg"
      >
        <Cookie
          size={22}
          aria-hidden="true"
        />
      </IconBackdrop>
    </div>
  ),
};
