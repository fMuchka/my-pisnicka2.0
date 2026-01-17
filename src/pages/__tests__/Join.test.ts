import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import Join from '../Join.vue';

// Mock router for navigation assertions
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: router.push }) }));

// Mock joinSession service to control outcomes
vi.mock('../../lib/session', () => ({ joinSession: vi.fn() }));

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
});
