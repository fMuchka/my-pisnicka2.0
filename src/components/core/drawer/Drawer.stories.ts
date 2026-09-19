import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ListMusicIcon } from 'lucide-vue-next';
import { h, ref, type FunctionalComponent } from 'vue';
import Button from '../button/Button.vue';
import Drawer from './Drawer.vue';

const SampleContent: FunctionalComponent = () =>
  h(
    'p',
    { style: 'margin: 0; color: var(--ink-muted); font-size: 14px; line-height: 21px;' },
    'Obsah draweru se vykresluje sem.'
  );

const meta = {
  title: 'Core/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    open: { table: { disable: true } },
  },
  args: {
    title: 'Filtry',
    titleIcon: { component: ListMusicIcon },
    content: SampleContent,
  },
  render: (args) => ({
    components: { Button, Drawer },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div>
        <Button
          label="Otevřít filtry"
          color-variation="secondary"
          style-variation="outlined"
          @click="open = true"
        />
        <Drawer
          v-bind="args"
          :open="open"
          @update:open="open = $event"
        />
      </div>
    `,
  }),
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutIcon: Story = {
  args: {
    titleIcon: undefined,
  },
};

export const WithoutTitle: Story = {
  args: {
    title: '',
    titleIcon: undefined,
  },
};
