import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStorageConsent } from '../../../../../stores/storageConsent';
import { PrivacySettings } from '../PrivacySettings';

describe('PrivacySettings', () => {
  beforeEach(() => {
    localStorage.clear();
    useStorageConsent.getState().setConsent('accepted');
  });

  it('explains what is always stored, what only with consent and what never', () => {
    render(<PrivacySettings />);

    expect(screen.getByRole('heading', { name: 'Soukromí' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /vždy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jen se souhlasem' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nikdy' })).toBeInTheDocument();
    expect(screen.getByText('Přihlášení.')).toBeInTheDocument();
    expect(screen.queryByText(/písně/i)).not.toBeInTheDocument();
  });

  it('withdraws and gives the consent back', async () => {
    const user = userEvent.setup();
    localStorage.setItem('my-pisnicka:theme', 'dark');
    render(<PrivacySettings />);
    const toggle = screen.getByRole('switch', { name: /pamatovat si moje nastavení/i });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(useStorageConsent.getState().consent).toBe('declined');
    expect(localStorage.getItem('my-pisnicka:theme')).toBeNull();
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(useStorageConsent.getState().consent).toBe('accepted');
  });

  it('shows the switch off for a user who has not decided yet', () => {
    useStorageConsent.setState({ consent: null });
    render(<PrivacySettings />);

    expect(screen.getByRole('switch', { name: /pamatovat si moje nastavení/i })).not.toBeChecked();
  });
});
