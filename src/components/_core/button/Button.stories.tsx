import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import StyledButton from './Button';

const meta = {
  title: 'Core/Button',
  component: StyledButton,
  tags: ['autodocs'],
  argTypes: {
    colorVariation: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    styleVariation: {
      control: 'select',
      options: ['filled', 'outlined', 'text'],
    },
    label: { control: 'text' },
  },
  args: {
    label: 'Uložit',
    colorVariation: 'primary',
    styleVariation: 'filled',
  },
} satisfies Meta<typeof StyledButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    colorVariation: 'secondary',
  },
};

export const Outlined: Story = {
  args: {
    styleVariation: 'outlined',
  },
};

export const Text: Story = {
  args: {
    styleVariation: 'text',
  },
};

export const WithIcon: Story = {
  args: {
    icon: Plus,
  },
};

// Icon-only: no `label`. The button keeps its normal pill shape since there's
// no dedicated icon-only styling.
export const IconOnly: Story = {
  args: {
    label: '',
    icon: Plus,
  },
};
