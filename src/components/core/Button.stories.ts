import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Plus } from 'lucide-vue-next';
import Button from './StyledButton.vue/index.js';

const meta = {
  title: 'Core/Button',
  component: Button,
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
    colorVariation: 'Primary',
    styleVariation: 'Filled',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    colorVariation: 'Secondary',
  },
};

export const Outlined: Story = {
  args: {
    styleVariation: 'Outlined',
  },
};

export const Text: Story = {
  args: {
    styleVariation: 'Text',
  },
};

export const WithIcon: Story = {
  args: {
    icon: { position: 'prepend', component: Plus },
  },
};

// Icon-only: no `label`. Also surfaces that `.btn-icon`'s square styling in
// Button.vue's CSS is never actually applied by the component's class logic.
export const IconOnly: Story = {
  args: {
    label: '',
    icon: { position: 'prepend', component: Plus },
  },
};
