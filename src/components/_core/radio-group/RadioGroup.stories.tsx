import type { Meta, StoryObj } from '@storybook/react-vite';
import RadioGroup from './RadioGroup';

const meta = {
  title: 'Core/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Motiv',
    defaultValue: 'dark',
    options: [
      { value: 'dark', label: 'Tmavý motiv' },
      { value: 'light', label: 'Světlý motiv' },
      { value: 'system', label: 'Podle systému' },
    ],
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'dark', label: 'Tmavý motiv' },
      { value: 'light', label: 'Světlý motiv' },
      { value: 'system', label: 'Podle systému', disabled: true },
    ],
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
