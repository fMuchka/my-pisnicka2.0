import type { Meta, StoryObj } from '@storybook/react-vite';
import Toggle from './Toggle';

const meta = {
  title: 'Core/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Notifikace o nových písních',
    defaultChecked: true,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = {
  args: { label: 'Automatické přehrávání', defaultChecked: false },
};

export const WithDescription: Story = {
  args: {
    label: 'Offline režim',
    description: 'Stáhne poslední otevřené písně pro čtení bez připojení.',
  },
};

export const DisabledState: Story = {
  args: { label: 'Sdílení polohy v relaci', defaultChecked: false, disabled: true },
};
