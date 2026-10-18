import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CookieNotice from '../CookieNotice.vue';

const STORAGE_KEY = 'my-pisnicka:cookie-notice-consent';

describe('CookieNotice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the notice when no consent decision is stored', async () => {
    render(CookieNotice);

    await waitFor(() => expect(screen.getByTestId('drawer-content')).toBeVisible());
    expect(screen.getByRole('button', { name: 'Rozumím' })).toBeVisible();
  });

  it('stays hidden when consent was already accepted', async () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');

    render(CookieNotice);

    await waitFor(() => expect(screen.getByTestId('drawer-content')).toHaveAttribute('hidden'));
  });

  it('treats any stored value other than the accepted sentinel as not yet consented', async () => {
    localStorage.setItem(STORAGE_KEY, 'declined');

    render(CookieNotice);

    await waitFor(() => expect(screen.getByTestId('drawer-content')).toBeVisible());
  });

  it('persists acceptance to localStorage and hides the notice when clicked', async () => {
    const user = userEvent.setup();
    render(CookieNotice);
    await waitFor(() => expect(screen.getByTestId('drawer-content')).toBeVisible());

    await user.click(screen.getByRole('button', { name: 'Rozumím' }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('accepted');
    await waitFor(() => expect(screen.getByTestId('drawer-content')).toHaveAttribute('hidden'));
  });
});
