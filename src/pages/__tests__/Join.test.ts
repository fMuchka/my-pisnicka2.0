import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// TDD: component to be implemented
import Join from '../Join.vue';

// Mock composable (optional), but keep most interactions through UI
vi.mock('../../lib/sessionApi', () => ({
  joinSession: vi.fn(async (_pin: string) => ({
    sessionId: 's1',
    sessionName: 'Zkouška',
    hostName: 'Hostitel',
  })),
}));

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('Join Page', () => {
  it('renders 4 inputs for PIN with auto-advance and paste support', async () => {
    render(Join);
    const d1 = screen.getByLabelText(/pin číslice 1/i);
    const d2 = screen.getByLabelText(/pin číslice 2/i);
    const d3 = screen.getByLabelText(/pin číslice 3/i);
    const d4 = screen.getByLabelText(/pin číslice 4/i);

    await userEvent.type(d1, '1');
    expect(document.activeElement).toBe(d2);

    await userEvent.paste(d1, '12 34');
    expect(d1).toHaveValue('1');
    expect(d2).toHaveValue('2');
    expect(d3).toHaveValue('3');
    expect(d4).toHaveValue('4');
  });

  it('prefills from ?pin=1234 and immediately attempts join', async () => {
    Object.defineProperty(window, 'location', {
      value: new URL('/join?pin=1234', 'http://localhost'),
    });
    render(Join);
    const status = await screen.findByText(/připojuji se/i);
    expect(status).toBeInTheDocument();
  });

  it('blocks non-digit input and shows error "Zadejte 4 číslice"', async () => {
    render(Join);
    const d1 = screen.getByLabelText(/pin číslice 1/i);
    await userEvent.type(d1, 'a');
    expect(await screen.findByText(/zadejte 4 číslice/i)).toBeInTheDocument();
  });

  it('submit calls joinSession and disables button while joining', async () => {
    render(Join);
    const btn = screen.getByRole('button', { name: /připojit se/i });
    const d1 = screen.getByLabelText(/pin číslice 1/i);
    const d2 = screen.getByLabelText(/pin číslice 2/i);
    const d3 = screen.getByLabelText(/pin číslice 3/i);
    const d4 = screen.getByLabelText(/pin číslice 4/i);

    await userEvent.type(d1, '1');
    await userEvent.type(d2, '2');
    await userEvent.type(d3, '3');
    await userEvent.type(d4, '4');
    await userEvent.click(btn);
    expect(btn).toBeDisabled();
  });

  it('on failure shows friendly error and keeps inputs', async () => {
    // Override mock to reject
    const { joinSession } = await import('../../lib/sessionApi');
    vi.mocked(joinSession).mockRejectedValue({ code: 'invalid', message: 'Neplatný PIN' });

    render(Join);
    const d1 = screen.getByLabelText(/pin číslice 1/i);
    const d2 = screen.getByLabelText(/pin číslice 2/i);
    const d3 = screen.getByLabelText(/pin číslice 3/i);
    const d4 = screen.getByLabelText(/pin číslice 4/i);

    await userEvent.type(d1, '1');
    await userEvent.type(d2, '2');
    await userEvent.type(d3, '3');
    await userEvent.type(d4, '4');

    const btn = screen.getByRole('button', { name: /připojit se/i });
    await userEvent.click(btn);

    expect(await screen.findByText(/neplatný pin/i)).toBeInTheDocument();
    expect(d1).toHaveValue('1');
    expect(d4).toHaveValue('4');
  });
});
