import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Music } from 'lucide-react';
import NavTile from '../NavTile';

describe('NavTile', () => {
  it('renders a button named by its label and meta', () => {
    render(
      <NavTile
        label="Písně"
        meta="Procvičování"
        icon={Music}
      />
    );

    expect(screen.getByRole('button', { name: /písně\s*procvičování/i })).toBeInTheDocument();
  });

  it('hides the icon from assistive technology', () => {
    const { container } = render(
      <NavTile
        label="Písně"
        icon={Music}
      />
    );

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the badge only when given', () => {
    const { rerender } = render(
      <NavTile
        label="Informace"
        icon={Music}
      />
    );
    expect(screen.queryByText('Nové')).not.toBeInTheDocument();

    rerender(
      <NavTile
        label="Informace"
        icon={Music}
        badge="Nové"
      />
    );
    expect(screen.getByText('Nové')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <NavTile
        label="Písně"
        icon={Music}
        onClick={onClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /písně/i }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not submit a surrounding form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <NavTile
          label="Písně"
          icon={Music}
        />
      </form>
    );

    await user.click(screen.getByRole('button', { name: /písně/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
