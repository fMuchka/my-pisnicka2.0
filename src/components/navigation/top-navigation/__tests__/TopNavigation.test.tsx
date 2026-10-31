import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopNavigation } from '../TopNavigation';

vi.mock('../user-options/UserOptions', () => ({
  UserOptions: () => <div data-testid="user-options" />,
}));

const noop = () => {};

describe('TopNavigation', () => {
  it('renders the logo button, user options and actions', () => {
    render(
      <TopNavigation
        onHome={noop}
        actions={<button type="button">Akce</button>}
      />
    );

    expect(screen.getByRole('banner')).toHaveClass('top-nav');
    expect(screen.getByRole('button', { name: 'MyPísnička' })).toHaveClass('nav-title');
    expect(screen.getByTestId('user-options')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Akce' })).toBeInTheDocument();
  });

  it('calls onHome when the logo is clicked', async () => {
    const user = userEvent.setup();
    const onHome = vi.fn();
    render(<TopNavigation onHome={onHome} />);

    await user.click(screen.getByRole('button', { name: 'MyPísnička' }));

    expect(onHome).toHaveBeenCalledOnce();
  });

  it('shows the page title row only for a non-blank title', () => {
    const { rerender } = render(
      <TopNavigation
        onHome={noop}
        pageTitle="Informace"
      />
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Informace' });
    expect(heading).toHaveClass('page-title');
    expect(heading.parentElement).toHaveClass('context-row');

    rerender(
      <TopNavigation
        onHome={noop}
        pageTitle="   "
      />
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('fades away and takes itself out of reach only when requested', () => {
    const { rerender } = render(<TopNavigation onHome={noop} />);
    expect(screen.getByRole('banner')).not.toHaveClass('fade-away');
    expect(screen.getByRole('banner')).not.toHaveAttribute('inert');

    rerender(
      <TopNavigation
        onHome={noop}
        fadeAway
      />
    );
    const banner = screen.getByRole('banner', { hidden: true });
    expect(banner).toHaveClass('fade-away');
    expect(banner).toHaveAttribute('inert');
  });

  it('keeps the logo image decorative, since the text names the button', () => {
    const { container } = render(<TopNavigation onHome={noop} />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')).toHaveClass('logo');
  });
});
