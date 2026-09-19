import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Plus } from 'lucide-vue-next';
import StyledButton from './StyledButton.vue';

const meta = {
  title: 'Core/Styled Button',
  component: StyledButton,
  tags: ['autodocs'],
  argTypes: {
    colorVariation: {
      control: 'select',
      options: ['Primary', 'Secondary'],
    },
    styleVariation: {
      control: 'select',
      options: ['Filled', 'Outlined', 'Text'],
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
    icon: { position: 'prepend', component: Plus },
  },
};

// Icon-only: no `label`. The button keeps its normal pill shape since there's
// no dedicated icon-only styling.
export const IconOnly: Story = {
  args: {
    label: '',
    icon: { position: 'prepend', component: Plus },
  },
};
