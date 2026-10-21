import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListMusicIcon } from 'lucide-react';
import Drawer from '../Drawer';

const noop = () => {};

describe('Drawer', () => {
  it('shows the title and content when open', () => {
    render(
      <Drawer
        open
        onOpenChange={noop}
        title="Filtry"
      >
        <p>Obsah draweru</p>
      </Drawer>
    );

    expect(screen.getByTestId('drawer-content')).toBeVisible();
    expect(screen.getByText('Filtry')).toBeVisible();
    expect(screen.getByText('Obsah draweru')).toBeVisible();
  });

  it('is not visible when closed', () => {
    render(
      <Drawer
        open={false}
        onOpenChange={noop}
        title="Filtry"
      />
    );

    expect(screen.getByTestId('drawer-content')).not.toBeVisible();
  });

  it('renders the title icon only when one is provided', () => {
    const { rerender } = render(
      <Drawer
        open
        onOpenChange={noop}
        title="Filtry"
        titleIcon={ListMusicIcon}
      />
    );

    const titleEl = () => screen.getByText('Filtry', { selector: '[data-part=title]' });
    expect(titleEl().querySelector('svg')).not.toBeNull();

    rerender(
      <Drawer
        open
        onOpenChange={noop}
        title="Filtry"
      />
    );
    expect(titleEl().querySelector('svg')).toBeNull();
  });

  it('reports open=false when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Drawer
        open
        onOpenChange={onOpenChange}
        title="Filtry"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Zavřít' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hides the close button when keepOpen is set, so it cannot be dismissed by clicking it', () => {
    render(
      <Drawer
        open
        onOpenChange={noop}
        title="Filtry"
        keepOpen
      />
    );

    expect(screen.queryByRole('button', { name: 'Zavřít' })).toBeNull();
  });
});
