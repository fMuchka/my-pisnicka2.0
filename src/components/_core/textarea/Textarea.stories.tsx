import type { Meta, StoryObj } from '@storybook/react-vite';
import Textarea from './Textarea';

const meta = {
  title: 'Core/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorText: { control: 'text' },
    rows: { control: 'number' },
    maxLength: { control: 'number' },
  },
  args: {
    label: 'Poznámka',
    placeholder: 'Přidej poznámku k písni…',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCounter: Story = {
  args: {
    defaultValue: 'Hraje se v G, kapo na 2. pražci. Refrén zpívat o oktávu níž.',
    rows: 4,
    maxLength: 280,
  },
};

export const Error: Story = {
  args: {
    label: 'Důvod nahlášení',
    placeholder: 'Popiš, co je u písně špatně…',
    invalid: true,
    errorText: 'Napiš prosím alespoň pár slov.',
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 'Tuto poznámku přidal administrátor.',
    disabled: true,
  },
};
