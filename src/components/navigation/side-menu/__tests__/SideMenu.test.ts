import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { HomeIcon, Info } from 'lucide-vue-next';
import { createMemoryHistory, createRouter } from 'vue-router';
import SideMenu from '../SideMenu.vue';

const pages = [
  { icon: { component: HomeIcon }, label: 'Domů', link: '/', id: 'home' },
  { icon: { component: Info }, label: 'Info', link: '/info', id: 'info' },
];

const renderSideMenu = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  });
  await router.push('/');
  await router.isReady();

  render(SideMenu, { props: { pages, currentPageId: 'home' }, global: { plugins: [router] } });

  return { router };
};

describe('SideMenu', () => {
  it('opens on trigger click and marks the current page', async () => {
    await renderSideMenu();

    expect(screen.queryByRole('link', { name: 'Domů' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Otevřít menu' }));

    expect(await screen.findByRole('link', { name: 'Domů' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Info' })).not.toHaveAttribute('aria-current');
  });

  it('navigates and closes when a link is clicked', async () => {
    const { router } = await renderSideMenu();

    await userEvent.click(screen.getByRole('button', { name: 'Otevřít menu' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Info' }));

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/info'));
    await vi.waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Info' })).not.toBeInTheDocument()
    );
  });
});
