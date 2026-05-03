import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import Join from '../Join.vue';

vi.mock('../../components/top-navigation/TopNavigation.vue', () => ({
  default: { template: '<header />' },
}));

vi.mock('../../components/core/PinCodeInput.vue', () => ({
  default: defineComponent({
    props: {
      modelValue: {
        type: Array,
        required: true,
      },
    },
    emits: ['update:modelValue'],
    setup(_props, { emit }) {
      return () =>
        h('input', {
          'aria-label': 'pin',
          onInput: (event: Event) => {
            const target = event.target as HTMLInputElement | null;
            const value = (target?.value ?? '').slice(0, 4).padEnd(4, '');
            emit('update:modelValue', value.split(''));
          },
        });
    },
  }),
}));

// Mock router for navigation assertions
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: router.push }) }));

const mocks = vi.hoisted(() => ({
  getSessionStatus: vi.fn(),
  getSessionErrorMessage: vi.fn(),
  createSessionRouterQuery: vi.fn(),
  setSessionFromModel: vi.fn(),
}));

vi.mock('../../stores/session', () => ({
  useSessionStore: () => ({
    setSessionFromModel: mocks.setSessionFromModel,
  }),
}));

vi.mock('../../lib/session', () => ({
  getSessionStatus: mocks.getSessionStatus,
  getSessionErrorMessage: mocks.getSessionErrorMessage,
  createSessionRouterQuery: mocks.createSessionRouterQuery,
}));

describe('Join Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionErrorMessage.mockReturnValue('');
    mocks.createSessionRouterQuery.mockImplementation((session: { id: string }) => ({
      sessionId: session.id,
      hostId: 'host-123',
      pin: '1234',
    }));
  });

  it('renders PIN inputs and submit button', () => {
    render(Join);
    expect(screen.getByLabelText('pin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /připojit/i })).toBeInTheDocument();
  });

  it('joins session and navigates on success', async () => {
    const user = userEvent.setup();

    mocks.getSessionStatus.mockResolvedValue({
      ok: true,
      session: {
        id: 'session-1',
        hostId: 'host-123',
        pin: '1234',
      },
    });

    render(Join);

    await user.type(screen.getByLabelText('pin'), '1234');
    await user.click(screen.getByRole('button', { name: /připojit/i }));

    await waitFor(() => {
      expect(mocks.getSessionStatus).toHaveBeenCalledWith('1234');
      expect(mocks.setSessionFromModel).toHaveBeenCalledWith({
        id: 'session-1',
        hostId: 'host-123',
        pin: '1234',
      });
      expect(router.push).toHaveBeenCalledWith({
        path: '/session',
        query: {
          sessionId: 'session-1',
          hostId: 'host-123',
          pin: '1234',
        },
      });
    });
  });

  it('shows translated error on failed join', async () => {
    const user = userEvent.setup();

    mocks.getSessionStatus.mockResolvedValue({
      ok: false,
      errorCode: 'not-found',
    });
    mocks.getSessionErrorMessage.mockReturnValue('Relace s tímto PINem neexistuje.');

    render(Join);

    await user.type(screen.getByLabelText('pin'), '1234');
    await user.click(screen.getByRole('button', { name: /připojit/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Relace s tímto PINem neexistuje.');
    expect(router.push).not.toHaveBeenCalled();
  });
});
