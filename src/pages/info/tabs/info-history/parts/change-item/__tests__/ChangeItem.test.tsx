import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangeItem } from '../ChangeItem';

describe('ChangeItem', () => {
  it('renders a plain row when there are no details', () => {
    const { container } = render(
      <ChangeItem change={{ type: 'fix', text: 'Oprava posunu', details: null }} />
    );

    expect(container.querySelector('details')).not.toBeInTheDocument();
    expect(screen.getByText('Oprava posunu').parentElement).toHaveClass(
      'change-row',
      'change-row--plain'
    );
  });

  it('expands to show details when clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChangeItem change={{ type: 'new', text: 'Playlisty', details: 'Ukládej si písně.' }} />
    );
    const details = container.querySelector('details');

    expect(details).not.toHaveAttribute('open');

    await user.click(screen.getByText('Playlisty'));

    expect(details).toHaveAttribute('open');
    expect(screen.getByText('Ukládej si písně.')).toBeVisible();
  });

  it('highlights the bullet of new changes only', () => {
    const { container, rerender } = render(
      <ChangeItem change={{ type: 'new', text: 'Playlisty', details: null }} />
    );
    expect(container.querySelector('.bullet')).toHaveClass('bullet--new');

    rerender(<ChangeItem change={{ type: 'improved', text: 'Rychlejší', details: null }} />);
    expect(container.querySelector('.bullet')).not.toHaveClass('bullet--new');
  });
});
