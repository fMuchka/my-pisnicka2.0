import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FirstVersionLink } from '../FirstVersionLink';
import { FIRST_VERSION_URL } from '../../../constants';

describe('FirstVersionLink', () => {
  it('opens the first version in a new tab', () => {
    render(<FirstVersionLink />);

    const link = screen.getByRole('link', { name: /první verze mypísničky/i });
    expect(link).toHaveAttribute('href', FIRST_VERSION_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveClass('v1-link');
  });
});
