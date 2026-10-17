import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Select from './Select.vue';
import type { SelectOption } from './types';

const sortOptions: SelectOption[] = [
  { value: 'artist', label: 'Podle interpreta' },
  { value: 'title', label: 'Podle názvu' },
  { value: 'recent', label: 'Naposledy přidané' },
];

const meta = {
  title: 'Core/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorText: { control: 'text' },
  },
  args: {
    label: 'Řazení',
    options: sortOptions,
    modelValue: 'artist',
  },
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref(args.modelValue ?? '');
      return { args, value };
    },
    template: `<div style="max-width: 360px"><Select v-bind="args" v-model="value" /></div>`,
  }),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: {
    label: 'Kategorie',
    modelValue: '',
    placeholder: 'Vyber kategorii',
    options: [
      { value: 'cz', label: 'České' },
      { value: 'en', label: 'Anglické' },
      { value: 'spiritual', label: 'Duchovní' },
    ],
  },
};

export const Error: Story = {
  args: {
    ...WithPlaceholder.args,
    invalid: true,
    errorText: 'Vyber prosím kategorii.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Jazyk zpěvníku',
    options: [{ value: 'cs', label: 'Čeština' }],
    modelValue: 'cs',
    disabled: true,
    helperText: 'Zatím dostupné jen v češtině.',
  },
};
