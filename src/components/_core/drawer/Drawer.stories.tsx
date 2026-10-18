import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListMusicIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import Button from '../button/Button';
import Drawer from './Drawer';

type DrawerDemoProps = Omit<ComponentProps<typeof Drawer>, 'open' | 'onOpenChange'> & {
  confirmToClose?: boolean;
};

function DrawerDemo({ confirmToClose = false, ...drawerProps }: DrawerDemoProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        label="Otevřít filtry"
        colorVariation="secondary"
        styleVariation="outlined"
        onClick={() => setOpen(true)}
      />
      <Drawer
        {...drawerProps}
        open={open}
        onOpenChange={setOpen}
      >
        {confirmToClose ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14, lineHeight: '21px' }}>
              Tento drawer nejde zavřít křížkem, klávesou Esc ani tažením — jen potvrzením.
            </p>
            <Button
              label="Potvrdit"
              onClick={() => setOpen(false)}
            />
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14, lineHeight: '21px' }}>
            Obsah draweru se vykresluje sem.
          </p>
        )}
      </Drawer>
    </div>
  );
}

const meta = {
  title: 'Core/Drawer',
  component: DrawerDemo,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
  },
  args: {
    title: 'Filtry',
    titleIcon: { component: ListMusicIcon },
  },
} satisfies Meta<typeof DrawerDemo>;

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

export const KeepOpen: Story = {
  args: {
    titleIcon: undefined,
    keepOpen: true,
    confirmToClose: true,
  },
};
