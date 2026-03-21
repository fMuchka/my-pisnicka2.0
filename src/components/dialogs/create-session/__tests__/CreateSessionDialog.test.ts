import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateSessionDialog from '../CreateSessionDialog.vue';

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createSession: vi.fn(),
  createSessionRouterQuery: vi.fn(),
}));

const mockUser = vi.hoisted(() =>
  mockRef<{ uid: string; displayName: string } | null>({
    uid: 'host-123',
    displayName: 'Test Host',
  })
);

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('../../../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('../../../../lib/session', () => ({
  createSession: mocks.createSession,
  createSessionRouterQuery: mocks.createSessionRouterQuery,
}));

describe('CreateSessionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = { uid: 'host-123', displayName: 'Test Host' };
    mocks.createSessionRouterQuery.mockImplementation(
      (session: { id: string; hostId: string; pin: string }) => ({
        sessionId: session.id,
        hostId: session.hostId,
        pin: session.pin,
      })
    );
  });

  it('disables submit until session name has at least 3 characters', async () => {
    const user = userEvent.setup();

    render(CreateSessionDialog, {
      props: { open: true },
    });

    const submitButton = screen.getByTestId('create-session-submit');
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText(/název relace/i), 'ab');
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText(/název relace/i), 'c');
    expect(submitButton).toBeEnabled();
  });

  it('creates a session, closes dialog, and navigates to session page', async () => {
    const user = userEvent.setup();
    const createdSession = {
      id: 'session-1',
      name: 'Nová relace',
      hostId: 'host-123',
      hostDisplayName: 'Test Host',
      isActive: true,
      pin: '2468',
      joinedBy: ['host-123'],
      createdAt: {
        seconds: 1,
        nanoseconds: 0,
      },
    };

    mocks.createSession.mockResolvedValue(createdSession);

    const { emitted } = render(CreateSessionDialog, {
      props: { open: true },
    });

    await user.type(screen.getByLabelText(/název relace/i), '  Nová relace  ');
    await user.click(screen.getByTestId('create-session-submit'));

    await waitFor(() => {
      expect(mocks.createSession).toHaveBeenCalledWith({
        name: 'Nová relace',
        hostId: 'host-123',
        hostDisplayName: 'Test Host',
      });

      expect(mocks.push).toHaveBeenCalledWith({
        path: '/session',
        query: {
          sessionId: 'session-1',
          hostId: 'host-123',
          pin: '2468',
        },
      });

      expect(emitted()['update:open']).toContainEqual([false]);
    });
  });

  it('shows auth error when user is not signed in', async () => {
    const user = userEvent.setup();
    mockUser.value = null;

    render(CreateSessionDialog, {
      props: { open: true },
    });

    await user.type(screen.getByLabelText(/název relace/i), 'Moje relace');
    await user.click(screen.getByTestId('create-session-submit'));

    expect(await screen.findByText('Nejprve se přihlas.')).toBeInTheDocument();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it('shows localized error when create session fails', async () => {
    const user = userEvent.setup();
    mocks.createSession.mockRejectedValue(new Error('network'));

    render(CreateSessionDialog, {
      props: { open: true },
    });

    await user.type(screen.getByLabelText(/název relace/i), 'Večerní jam');
    await user.click(screen.getByTestId('create-session-submit'));

    expect(
      await screen.findByText('Nepodařilo se vytvořit relaci. Zkus to prosím znovu.')
    ).toBeInTheDocument();
  });
});
