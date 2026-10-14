import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Settings from '../Settings.vue';

describe('Settings Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('switches the theme when a theme card is clicked', async () => {
    const user = userEvent.setup();
    render(Settings);

    await user.click(screen.getByRole('button', { name: /tmavý/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /tmavý/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /světlý/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('switches the color preset when a swatch is clicked', async () => {
    const user = userEvent.setup();
    render(Settings);

    await user.click(screen.getByRole('button', { name: 'Les' }));

    expect(document.documentElement.getAttribute('data-color')).toBe('green');
    expect(screen.getByRole('button', { name: 'Les' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Klasika' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
