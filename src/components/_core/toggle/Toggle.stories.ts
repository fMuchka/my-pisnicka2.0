import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Toggle from './Toggle.vue';

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
    modelValue: true,
  },
  render: (args) => ({
    components: { Toggle },
    setup() {
      const checked = ref(args.modelValue ?? false);
      return { args, checked };
    },
    template: `<div style="max-width: 360px"><Toggle v-bind="args" v-model="checked" /></div>`,
  }),
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = {
  args: { label: 'Automatické přehrávání', modelValue: false },
};

export const WithDescription: Story = {
  args: {
    label: 'Offline režim',
    description: 'Stáhne poslední otevřené písně pro čtení bez připojení.',
  },
};

export const Disabled: Story = {
  args: { label: 'Sdílení polohy v relaci', modelValue: false, disabled: true },
};
