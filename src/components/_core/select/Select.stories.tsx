import type { Meta, StoryObj } from '@storybook/react-vite';
import Select from './Select';
import type { SelectOption } from './types';

const sortOptions: SelectOption[] = [
  { value: 'artist', label: 'Podle interpreta' },
  { value: 'title', label: 'Podle názvu' },
  { value: 'recent', label: 'Naposledy přidané' },
];

const categoryOptions: SelectOption[] = [
  { value: 'cz', label: 'České' },
  { value: 'en', label: 'Anglické' },
  { value: 'spiritual', label: 'Duchovní' },
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
    defaultValue: 'artist',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: {
    label: 'Kategorie',
    defaultValue: '',
    placeholder: 'Vyber kategorii',
    options: categoryOptions,
  },
};

export const Error: Story = {
  args: {
    label: 'Kategorie',
    defaultValue: '',
    placeholder: 'Vyber kategorii',
    options: categoryOptions,
    invalid: true,
    errorText: 'Vyber prosím kategorii.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Jazyk zpěvníku',
    options: [{ value: 'cs', label: 'Čeština' }],
    defaultValue: 'cs',
    disabled: true,
    helperText: 'Zatím dostupné jen v češtině.',
  },
};
