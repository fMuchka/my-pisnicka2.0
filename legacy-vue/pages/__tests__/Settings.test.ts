import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import Settings from '../Settings.vue';
import { useSessionStore } from '../../stores/session';

const auth = vi.hoisted(() => ({ isGuest: false }));

vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({ isGuest: ref(auth.isGuest) }),
}));

let pinia: Pinia;

const renderSettings = () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  });

  return render(Settings, { global: { plugins: [router, pinia] } });
};

describe('Settings Page', () => {
  beforeEach(() => {
    localStorage.clear();
    auth.isGuest = false;
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('switches the theme when a theme card is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: /tmavý/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /tmavý/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /světlý/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('switches the color preset when a swatch is clicked', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Les' }));

    expect(document.documentElement.getAttribute('data-color')).toBe('green');
    expect(screen.getByRole('button', { name: 'Les' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Klasika' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('links guests back to their session', () => {
    auth.isGuest = true;
    useSessionStore().setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: true });
    renderSettings();

    expect(screen.getByRole('link', { name: /zpět do relace/i })).toHaveAttribute(
      'href',
      '/session?sessionId=s1&hostId=h1&pin=1234'
    );
  });

  it('shows no session link to hosts', () => {
    useSessionStore().setSessionDetails({ id: 's1', hostId: 'h1', pin: '1234', isActive: true });
    renderSettings();

    expect(screen.queryByRole('link', { name: /zpět do relace/i })).not.toBeInTheDocument();
  });
});
