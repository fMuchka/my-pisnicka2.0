import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Textarea from './Textarea.vue';

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
  render: (args) => ({
    components: { Textarea },
    setup() {
      const value = ref(args.modelValue ?? '');
      return { args, value };
    },
    template: `<div style="max-width: 360px"><Textarea v-bind="args" v-model="value" /></div>`,
  }),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCounter: Story = {
  args: {
    modelValue: 'Hraje se v G, kapo na 2. pražci. Refrén zpívat o oktávu níž.',
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
    modelValue: 'Tuto poznámku přidal administrátor.',
    disabled: true,
  },
};
