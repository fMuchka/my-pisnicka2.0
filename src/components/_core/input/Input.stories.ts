import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Search } from 'lucide-vue-next';
import { ref } from 'vue';
import Input from './Input.vue';

const meta = {
  title: 'Core/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorText: { control: 'text' },
    successText: { control: 'text' },
  },
  args: {
    label: 'Uživatel',
    placeholder: 'Tom Bombadil',
    type: 'text',
  },
  render: (args) => ({
    components: { Input },
    setup() {
      const value = ref(args.modelValue ?? '');
      return { args, value };
    },
    template: `<div style="max-width: 360px"><Input v-bind="args" v-model="value" /></div>`,
  }),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHelper: Story = {
  args: {
    label: 'Název playlistu',
    placeholder: 'Např. Večerní hraní',
    helperText: 'Název musí obsahovat alespoň 1 znak',
    required: true,
  },
};

export const Error: Story = {
  args: {
    label: 'E-mail',
    type: 'email',
    modelValue: 'tom@',
    invalid: true,
    errorText: 'Zadej platnou e-mailovou adresu.',
  },
};

export const Success: Story = {
  args: {
    modelValue: 'Tom Bombadil',
    success: true,
    successText: 'Uživatelské jméno je volné.',
  },
};

export const Disabled: Story = {
  args: {
    modelValue: 'Nelze upravit',
    disabled: true,
    helperText: 'Tuto položku spravuje administrátor.',
  },
};

export const Password: Story = {
  args: {
    label: 'Heslo',
    type: 'password',
    placeholder: '•••••',
    modelValue: 'tajneheslo',
  },
};

export const SearchField: Story = {
  args: {
    label: undefined,
    type: 'search',
    placeholder: 'Hledat interpreta nebo píseň…',
    prependIcon: Search,
  },
  render: (args) => ({
    components: { Input },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template: `<div style="max-width: 360px"><Input v-bind="args" v-model="value" aria-label="Hledat" /></div>`,
  }),
};

export const AllStates: Story = {
  render: () => ({
    components: { Input },
    setup() {
      return { Search };
    },
    template: `
      <div style="max-width: 360px; display: flex; flex-direction: column; gap: 24px">
        <Input label="Výchozí" placeholder="Tom Bombadil" />
        <Input label="Chyba" model-value="tom@" invalid error-text="Zadej platnou e-mailovou adresu." />
        <Input label="Ověřeno" model-value="Tom Bombadil" success success-text="Uživatelské jméno je volné." />
        <Input label="Zakázáno" model-value="Nelze upravit" disabled helper-text="Tuto položku spravuje administrátor." />
        <Input label="Heslo" type="password" model-value="tajneheslo" />
        <Input type="search" aria-label="Hledat" placeholder="Hledat interpreta nebo píseň…" :prepend-icon="Search" />
      </div>
    `,
  }),
};
