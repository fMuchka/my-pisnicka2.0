import type { Meta, StoryObj } from '@storybook/react-vite';
import { Info, Music, Settings, Users } from 'lucide-react';
import { fn } from 'storybook/test';
import NavTile from './NavTile';

const meta = {
  title: 'Components/NavTile',
  component: NavTile,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    meta: { control: 'text' },
    badge: { control: 'text' },
    icon: { control: false },
  },
  args: {
    label: 'Písně',
    meta: 'Procvičování',
    icon: Music,
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 220 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// The Domů "Informace" tile while the timeline has unseen updates.
export const WithBadge: Story = {
  args: {
    label: 'Informace',
    meta: 'Co bylo, je a bude',
    icon: Info,
    badge: 'Nové',
  },
};

export const WithoutMeta: Story = {
  args: {
    meta: undefined,
  },
};

// The Domů screen's two-column grid.
export const Grid: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
      <NavTile
        {...args}
        label="Písně"
        meta="Procvičování"
        icon={Music}
      />
      <NavTile
        {...args}
        label="Relace"
        meta="Společné hraní"
        icon={Users}
      />
      <NavTile
        {...args}
        label="Informace"
        meta="Co bylo, je a bude"
        icon={Info}
        badge="Nové"
      />
      <NavTile
        {...args}
        label="Nastavení"
        meta="Vzhled a motiv"
        icon={Settings}
      />
    </div>
  ),
};
