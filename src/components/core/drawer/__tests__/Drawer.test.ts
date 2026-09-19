import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { h } from 'vue';
import { ListMusicIcon } from 'lucide-vue-next';
import Drawer from '../Drawer.vue';

describe('Drawer', () => {
  it('shows the title and content when open', () => {
    render(Drawer, {
      props: {
        open: true,
        title: 'Filtry',
        content: () => h('p', 'Obsah draweru'),
      },
    });

    expect(screen.getByTestId('drawer-content')).toBeVisible();
    expect(screen.getByText('Filtry')).toBeVisible();
    expect(screen.getByText('Obsah draweru')).toBeVisible();
  });

  it('is not visible when closed', () => {
    render(Drawer, {
      props: {
        open: false,
        title: 'Filtry',
      },
    });

    expect(screen.getByTestId('drawer-content')).not.toBeVisible();
  });

  it('renders the title icon only when one is provided', async () => {
    const { rerender } = render(Drawer, {
      props: {
        open: true,
        title: 'Filtry',
        titleIcon: { component: ListMusicIcon },
      },
    });

    const titleEl = () => screen.getByText('Filtry', { selector: '[data-part=title]' });
    expect(titleEl().querySelector('svg')).not.toBeNull();

    await rerender({ open: true, title: 'Filtry', titleIcon: undefined });
    expect(titleEl().querySelector('svg')).toBeNull();
  });

  it('emits update:open false when the close button is clicked', async () => {
    const user = userEvent.setup();

    const { emitted } = render(Drawer, {
      props: {
        open: true,
        title: 'Filtry',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Zavřít' }));

    expect(emitted()['update:open']).toContainEqual([false]);
  });

  it('hides the close button when keepOpen is set, so it cannot be dismissed by clicking it', () => {
    render(Drawer, {
      props: {
        open: true,
        title: 'Filtry',
        keepOpen: true,
      },
    });

    expect(screen.queryByRole('button', { name: 'Zavřít' })).toBeNull();
  });
});
