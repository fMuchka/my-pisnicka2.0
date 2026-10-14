import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { useSessionStore } from '../../stores/session';
import Routes from '../Routes';

const auth = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: ref(auth.isAuthenticated),
    waitForAuthReady: () => Promise.resolve(),
  }),
}));

const mocks = vi.hoisted(() => ({ getSessionStatus: vi.fn() }));

vi.mock('../../lib/session', () => ({ getSessionStatus: mocks.getSessionStatus }));

vi.mock('../../pages/Settings.vue', () => ({ default: { render: () => null } }));
vi.mock('../../pages/Login.vue', () => ({ default: { render: () => null } }));

const { router } = await import('../index');

describe('router guard', () => {
  beforeEach(async () => {
    auth.isAuthenticated = false;
    sessionStorage.clear();
    setActivePinia(createPinia());
    await router.replace(Routes.Login);
  });

  it('lets guests with an active session open Settings', async () => {
    useSessionStore().setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: true });

    await router.push(Routes.Settings);

    expect(router.currentRoute.value.path).toBe(Routes.Settings);
  });

  it('sends guests without a session to Login', async () => {
    await router.push(Routes.Settings);

    expect(router.currentRoute.value.path).toBe(Routes.Login);
  });

  it('sends guests whose session closed to Login', async () => {
    useSessionStore().setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: false });

    await router.push(Routes.Settings);

    expect(router.currentRoute.value.path).toBe(Routes.Login);
  });

  it('waits for a restored session to be rechecked before letting a guest in', async () => {
    sessionStorage.setItem(
      'my-pisnicka:session',
      JSON.stringify({ id: 's1', hostId: 'h1', pin: '1234', isActive: true })
    );
    mocks.getSessionStatus.mockResolvedValue({ ok: false, errorCode: 'inactive' });
    setActivePinia(createPinia());

    await router.push(Routes.Settings);

    expect(router.currentRoute.value.path).toBe(Routes.Login);
  });

  it('lets signed-in users open Settings', async () => {
    auth.isAuthenticated = true;

    await router.push(Routes.Settings);

    expect(router.currentRoute.value.path).toBe(Routes.Settings);
  });
});
