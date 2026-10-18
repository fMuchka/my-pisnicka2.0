import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { emptyPin, stringToPin, type PIN } from '../../../lib/pin';
import PinCodeInput from './PinCodeInput';

const meta = {
  title: 'Core/PinCodeInput',
  component: PinCodeInput,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    showLabel: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
  args: {
    value: emptyPin(),
    showLabel: true,
    readOnly: false,
  },
  // Controlled component: keep the typed digits in story state.
  render: function Render(args) {
    const [pin, setPin] = useState<PIN>(args.value);
    return (
      <PinCodeInput
        {...args}
        value={pin}
        onValueChange={setPin}
      />
    );
  },
} satisfies Meta<typeof PinCodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PartiallyFilled: Story = {
  args: {
    value: stringToPin('42'),
  },
};

// How the share dialog shows an existing session's PIN.
export const ReadOnly: Story = {
  args: {
    value: stringToPin('4821'),
    readOnly: true,
    showLabel: false,
  },
};
