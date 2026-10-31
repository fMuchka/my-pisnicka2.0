import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStorageConsent } from '../../../stores/storageConsent';
import { CookieNotice } from '../CookieNotice';

const CONSENT_KEY = 'my-pisnicka:cookie-notice-consent';

describe('CookieNotice', () => {
  beforeEach(() => {
    localStorage.clear();
    useStorageConsent.setState({ consent: null });
  });

  it('asks until the user decides', () => {
    render(<CookieNotice />);

    expect(screen.getByText('Sušenky, co nešmírují')).toBeVisible();
    expect(screen.getByText(/nesledujeme a nemáme reklamy/i)).toBeInTheDocument();
  });

  it('stays hidden once the user has decided', () => {
    useStorageConsent.setState({ consent: 'declined' });
    render(<CookieNotice />);

    // The drawer stays mounted while closed, just hidden.
    expect(screen.getByTestId('drawer-content')).not.toBeVisible();
  });

  it('accepts', async () => {
    const user = userEvent.setup();
    render(<CookieNotice />);

    await user.click(screen.getByRole('button', { name: 'Přijmout' }));

    expect(useStorageConsent.getState().consent).toBe('accepted');
    expect(localStorage.getItem(CONSENT_KEY)).toBe('accepted');
  });

  it('declines down to the essentials', async () => {
    const user = userEvent.setup();
    localStorage.setItem('my-pisnicka:theme', 'dark');
    render(<CookieNotice />);

    await user.click(screen.getByRole('button', { name: 'Jen nezbytné' }));

    expect(useStorageConsent.getState().consent).toBe('declined');
    expect(localStorage.getItem(CONSENT_KEY)).toBe('declined');
    expect(localStorage.getItem('my-pisnicka:theme')).toBeNull();
  });
});
