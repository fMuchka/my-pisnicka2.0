import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FONT_SIZE_LIMITS } from '../../../../../hooks/useTheme';
import { FontSizeStepper } from '../FontSizeStepper';

describe('FontSizeStepper', () => {
  it('shows the size in a group named after the setting', () => {
    render(
      <FontSizeStepper
        label="Akordy"
        value={16}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('group', { name: 'Akordy' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('16 px');
  });

  it('steps the size by a pixel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FontSizeStepper
        label="Akordy"
        value={16}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Akordy: zvětšit' }));
    expect(onChange).toHaveBeenLastCalledWith(17);

    await user.click(screen.getByRole('button', { name: 'Akordy: zmenšit' }));
    expect(onChange).toHaveBeenLastCalledWith(15);
  });

  it('stops at the limits', () => {
    const { rerender } = render(
      <FontSizeStepper
        label="Akordy"
        value={FONT_SIZE_LIMITS.min}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Akordy: zmenšit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Akordy: zvětšit' })).toBeEnabled();

    rerender(
      <FontSizeStepper
        label="Akordy"
        value={FONT_SIZE_LIMITS.max}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Akordy: zvětšit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Akordy: zmenšit' })).toBeEnabled();
  });
});
