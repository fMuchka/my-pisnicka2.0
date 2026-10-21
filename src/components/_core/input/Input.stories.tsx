import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import Input from './Input';

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
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
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

export const ErrorState: Story = {
  args: {
    label: 'E-mail',
    type: 'email',
    defaultValue: 'tom@',
    invalid: true,
    errorText: 'Zadej platnou e-mailovou adresu.',
  },
};

export const SuccessState: Story = {
  args: {
    defaultValue: 'Tom Bombadil',
    success: true,
    successText: 'Uživatelské jméno je volné.',
  },
};

export const DisabledState: Story = {
  args: {
    defaultValue: 'Nelze upravit',
    disabled: true,
    helperText: 'Tuto položku spravuje administrátor.',
  },
};

export const Password: Story = {
  args: {
    label: 'Heslo',
    type: 'password',
    placeholder: '•••••',
    defaultValue: 'tajneheslo',
  },
};

export const SearchField: Story = {
  args: {
    label: undefined,
    type: 'search',
    placeholder: 'Hledat interpreta nebo píseň…',
    prependIcon: Search,
    'aria-label': 'Hledat',
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Input
        label="Výchozí"
        placeholder="Tom Bombadil"
      />
      <Input
        label="Chyba"
        defaultValue="tom@"
        invalid
        errorText="Zadej platnou e-mailovou adresu."
      />
      <Input
        label="Ověřeno"
        defaultValue="Tom Bombadil"
        success
        successText="Uživatelské jméno je volné."
      />
      <Input
        label="Zakázáno"
        defaultValue="Nelze upravit"
        disabled
        helperText="Tuto položku spravuje administrátor."
      />
      <Input
        label="Heslo"
        type="password"
        defaultValue="tajneheslo"
      />
      <Input
        type="search"
        aria-label="Hledat"
        placeholder="Hledat interpreta nebo píseň…"
        prependIcon={Search}
      />
    </div>
  ),
};
