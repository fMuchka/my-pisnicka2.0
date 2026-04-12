import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import SessionList from '../SessionList.vue';

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

const fetchAllUserSessions = vi.hoisted(() => vi.fn());
const mockUser = vi.hoisted(() => mockRef({ uid: 'host-123', displayName: 'Test Host' }));
const routerPush = vi.hoisted(() => vi.fn());

vi.mock('../../components/top-navigation/TopNavigation.vue', () => ({
  default: defineComponent({
    name: 'TopNavigation',
    props: {
      pageTitle: { type: String, default: '' },
    },
    setup(props) {
      return () => h('div', { 'data-testid': 'top-navigation' }, props.pageTitle);
    },
  }),
}));

vi.mock('../../components/core/LoadingSpinner.vue', () => ({
  default: defineComponent({
    name: 'LoadingSpinner',
    setup() {
      return () => h('div', { 'data-testid': 'loading-spinner' }, 'Loading');
    },
  }),
}));

vi.mock('../../components/core/ErrorMessage.vue', () => ({
  default: defineComponent({
    name: 'ErrorMessage',
    props: {
      message: { type: String, default: '' },
    },
    setup(props) {
      return () => h('div', { 'data-testid': 'error-message' }, props.message);
    },
  }),
}));

vi.mock('../../components/dialogs/create-session/CreateSessionDialog.vue', () => ({
  default: defineComponent({
    name: 'CreateSessionDialog',
    props: {
      open: { type: Boolean, default: false },
    },
    setup(props) {
      return () =>
        props.open
          ? h('div', { 'data-testid': 'create-session-dialog' }, 'Create session dialog')
          : null;
    },
  }),
}));

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('../../stores/session', () => ({
  useSessionStore: () => ({
    setSessionFromModel: vi.fn(),
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('../../lib/session', async () => {
  const actual = await vi.importActual<typeof import('../../lib/session')>('../../lib/session');

  return {
    ...actual,
    fetchAllUserSessions,
  };
});

describe('SessionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAllUserSessions.mockResolvedValue([]);
  });

  it('renders the session list layout', () => {
    render(SessionList);

    expect(screen.getByTestId('session-list-view')).toBeInTheDocument();
    expect(screen.getByTestId('top-navigation')).toHaveTextContent('Seznam Relací');
    expect(screen.getByRole('button', { name: 'Vytvořit novou relaci' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Připojit se k relaci' })).toBeInTheDocument();
  });

  it('opens the create session dialog from the page action', async () => {
    render(SessionList);

    await fireEvent.click(screen.getByRole('button', { name: 'Vytvořit novou relaci' }));

    expect(screen.getByTestId('create-session-dialog')).toBeInTheDocument();
  });

  it('routes to join page from the page action', async () => {
    render(SessionList);

    await fireEvent.click(screen.getByRole('button', { name: 'Připojit se k relaci' }));

    expect(routerPush).toHaveBeenCalledWith({ path: '/join' });
  });
});
