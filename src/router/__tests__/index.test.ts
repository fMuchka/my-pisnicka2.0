import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter } from 'react-router';
import Routes from '../Routes';

const auth = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock('../../hooks/useAuth', () => ({
  isAuthenticated: () => auth.isAuthenticated,
  waitForAuthReady: () => Promise.resolve(),
}));

const mocks = vi.hoisted(() => ({ getSessionStatus: vi.fn() }));

vi.mock('../../lib/session', () => ({ getSessionStatus: mocks.getSessionStatus }));

// The session store restores itself on import, so each case loads fresh modules.
const loadRouter = async () => {
  vi.resetModules();
  const [{ routes }, { useSessionStore }] = await Promise.all([
    import('../index'),
    import('../../stores/session'),
  ]);
  const router = createMemoryRouter(routes, { initialEntries: [Routes.Login] });
  return { router, useSessionStore };
};

describe('router guard', () => {
  beforeEach(() => {
    auth.isAuthenticated = false;
    sessionStorage.clear();
  });

  it('lets guests with an active session open Settings', async () => {
    const { router, useSessionStore } = await loadRouter();
    useSessionStore
      .getState()
      .setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: true });

    await router.navigate(Routes.Settings);

    expect(router.state.location.pathname).toBe(Routes.Settings);
  });

  it('sends guests without a session to Login', async () => {
    const { router } = await loadRouter();

    await router.navigate(Routes.Settings);

    expect(router.state.location.pathname).toBe(Routes.Login);
  });

  it('sends guests whose session closed to Login', async () => {
    const { router, useSessionStore } = await loadRouter();
    useSessionStore
      .getState()
      .setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: false });

    await router.navigate(Routes.Settings);

    expect(router.state.location.pathname).toBe(Routes.Login);
  });

  it('waits for a restored session to be rechecked before letting a guest in', async () => {
    sessionStorage.setItem(
      'my-pisnicka:session',
      JSON.stringify({ id: 's1', hostId: 'h1', pin: '1234', isActive: true })
    );
    mocks.getSessionStatus.mockResolvedValue({ ok: false, errorCode: 'inactive' });
    const { router } = await loadRouter();

    await router.navigate(Routes.Settings);

    expect(router.state.location.pathname).toBe(Routes.Login);
  });

  it('lets signed-in users open Settings', async () => {
    auth.isAuthenticated = true;
    const { router } = await loadRouter();

    await router.navigate(Routes.Settings);

    expect(router.state.location.pathname).toBe(Routes.Settings);
  });

  it('keeps song detail public but protects song creation', async () => {
    const { router } = await loadRouter();

    await router.navigate('/song/abc');
    expect(router.state.location.pathname).toBe('/song/abc');

    await router.navigate(Routes.SongCreate);
    expect(router.state.location.pathname).toBe(Routes.Login);
  });
});
