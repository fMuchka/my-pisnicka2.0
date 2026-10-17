import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import RadioGroup from './RadioGroup.vue';

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
    modelValue: 'dark',
    options: [
      { value: 'dark', label: 'Tmavý motiv' },
      { value: 'light', label: 'Světlý motiv' },
      { value: 'system', label: 'Podle systému' },
    ],
  },
  render: (args) => ({
    components: { RadioGroup },
    setup() {
      const value = ref(args.modelValue ?? '');
      return { args, value };
    },
    template: `<RadioGroup v-bind="args" v-model="value" />`,
  }),
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
