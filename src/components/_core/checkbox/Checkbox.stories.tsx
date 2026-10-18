import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Checkbox from './Checkbox';

const meta = {
  title: 'Core/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: ['default', 'chip'] },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Zapamatovat si mě',
    variant: 'default',
    defaultChecked: true,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checked: Story = {};

export const Unchecked: Story = {
  args: { label: 'Posílat novinky e-mailem', defaultChecked: false },
};

export const Disabled: Story = {
  args: { label: 'Nedostupné pro tento účet', defaultChecked: false, disabled: true },
};

function ChipGroupDemo() {
  const [chords, setChords] = useState({ C: true, G: false, Am: false });
  const toggle = (chord: keyof typeof chords) => (checked: boolean) =>
    setChords({ ...chords, [chord]: checked });

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Checkbox
        checked={chords.C}
        onCheckedChange={toggle('C')}
        label="C dur"
        variant="chip"
      />
      <Checkbox
        checked={chords.G}
        onCheckedChange={toggle('G')}
        label="G dur"
        variant="chip"
      />
      <Checkbox
        checked={chords.Am}
        onCheckedChange={toggle('Am')}
        label="A moll"
        variant="chip"
      />
    </div>
  );
}

// Pill-shaped variant for picking several tags at once, e.g. chord filters.
export const ChipGroup: Story = {
  render: () => <ChipGroupDemo />,
};
