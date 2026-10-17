import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Checkbox from './Checkbox.vue';

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
    modelValue: true,
  },
  render: (args) => ({
    components: { Checkbox },
    setup() {
      const checked = ref(args.modelValue ?? false);
      return { args, checked };
    },
    template: `<Checkbox v-bind="args" v-model="checked" />`,
  }),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checked: Story = {};

export const Unchecked: Story = {
  args: { label: 'Posílat novinky e-mailem', modelValue: false },
};

export const Disabled: Story = {
  args: { label: 'Nedostupné pro tento účet', modelValue: false, disabled: true },
};

// Pill-shaped variant for picking several tags at once, e.g. chord filters.
export const ChipGroup: Story = {
  render: () => ({
    components: { Checkbox },
    setup() {
      const chords = ref({ C: true, G: false, Am: false });
      return { chords };
    },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <Checkbox v-model="chords.C" label="C dur" variant="chip" />
        <Checkbox v-model="chords.G" label="G dur" variant="chip" />
        <Checkbox v-model="chords.Am" label="A moll" variant="chip" />
      </div>
    `,
  }),
};
