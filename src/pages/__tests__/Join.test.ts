import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock router for navigation assertions
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: router.push }) }));

// Mock joinSession service to control outcomes
vi.mock('../../lib/session', () => ({ joinSession: vi.fn() }));
import { joinSession } from '../../lib/session';

import Join from '../Join.vue';

describe('Join Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PIN inputs and submit button', () => {
    render(Join);
    // 4 numeric pin inputs
    expect(screen.getByLabelText('pin číslice 1')).toBeInTheDocument();
    expect(screen.getByLabelText('pin číslice 2')).toBeInTheDocument();
    expect(screen.getByLabelText('pin číslice 3')).toBeInTheDocument();
    expect(screen.getByLabelText('pin číslice 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /připojit/i })).toBeInTheDocument();
  });

  it('concatenates PIN digits and calls joinSession', async () => {
    render(Join);
    await userEvent.type(screen.getByLabelText('pin číslice 1'), '1');
    await userEvent.type(screen.getByLabelText('pin číslice 2'), '2');
    await userEvent.type(screen.getByLabelText('pin číslice 3'), '3');
    await userEvent.type(screen.getByLabelText('pin číslice 4'), '4');
    (joinSession as Mock).mockResolvedValue({ ok: true, sessionId: 'sess-123' });

    await userEvent.click(screen.getByRole('button', { name: /připojit/i }));
    expect(joinSession).toHaveBeenCalledWith('1234');
  });

  it('disables the button while joining (loading state)', async () => {
    render(Join);
    await userEvent.type(screen.getByLabelText('pin číslice 1'), '1');
    await userEvent.type(screen.getByLabelText('pin číslice 2'), '2');
    await userEvent.type(screen.getByLabelText('pin číslice 3'), '3');
    await userEvent.type(screen.getByLabelText('pin číslice 4'), '4');
    (joinSession as Mock).mockResolvedValue({ ok: true, sessionId: 'sess-123' });

    const button = screen.getByRole('button', { name: /připojit/i });
    await userEvent.click(button);
    expect(button).toBeDisabled();
  });

  it('shows inline error when PIN invalid or inactive', async () => {
    render(Join);
    await userEvent.type(screen.getByLabelText('pin číslice 1'), '9');
    await userEvent.type(screen.getByLabelText('pin číslice 2'), '9');
    await userEvent.type(screen.getByLabelText('pin číslice 3'), '9');
    await userEvent.type(screen.getByLabelText('pin číslice 4'), '9');
    (joinSession as Mock).mockResolvedValue({ ok: false, errorCode: 'not-found' });

    await userEvent.click(screen.getByRole('button', { name: /připojit/i }));
    // Expect Czech inline error message (to be implemented)
    expect(await screen.findByText('Parta s tímto PINem neexistuje.')).toBeInTheDocument();
  });

  it('navigates to Session view on success', async () => {
    render(Join);
    await userEvent.type(screen.getByLabelText('pin číslice 1'), '1');
    await userEvent.type(screen.getByLabelText('pin číslice 2'), '2');
    await userEvent.type(screen.getByLabelText('pin číslice 3'), '3');
    await userEvent.type(screen.getByLabelText('pin číslice 4'), '4');
    (joinSession as Mock).mockResolvedValue({ ok: true, sessionId: 'sess-123' });

    await userEvent.click(screen.getByRole('button', { name: /připojit/i }));
    // Expect navigation to Session view (to be implemented)
    expect(router.push).toHaveBeenCalled();
  });
});
