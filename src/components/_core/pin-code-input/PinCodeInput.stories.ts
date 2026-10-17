import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { emptyPin, stringToPin } from '../../../lib/pin';
import PinCodeInput from './PinCodeInput.vue';

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
    modelValue: emptyPin(),
    showLabel: true,
    readOnly: false,
  },
  render: (args) => ({
    components: { PinCodeInput },
    setup() {
      const pin = ref(args.modelValue);
      return { args, pin };
    },
    template: `<PinCodeInput v-bind="args" v-model="pin" />`,
  }),
} satisfies Meta<typeof PinCodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PartiallyFilled: Story = {
  args: {
    modelValue: stringToPin('42'),
  },
};

// How the share dialog shows an existing session's PIN.
export const ReadOnly: Story = {
  args: {
    modelValue: stringToPin('4821'),
    readOnly: true,
    showLabel: false,
  },
};
