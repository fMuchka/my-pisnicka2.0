import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnseenBanner } from '../UnseenBanner';

describe('UnseenBanner', () => {
  it('pluralizes the change count', () => {
    const { rerender } = render(<UnseenBanner count={1} />);
    expect(screen.getByText('1 změna od tvé poslední návštěvy')).toBeInTheDocument();

    rerender(<UnseenBanner count={3} />);
    expect(screen.getByText('3 změny od tvé poslední návštěvy')).toBeInTheDocument();

    rerender(<UnseenBanner count={5} />);
    expect(screen.getByText('5 změn od tvé poslední návštěvy')).toBeInTheDocument();
  });
});
