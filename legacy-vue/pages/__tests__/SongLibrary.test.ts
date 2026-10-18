import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import SongLibrary from '../SongLibrary.vue';
import Routes from '../../router/Routes';
import { pageNavigation } from '../../composables/usePageNavigation';

const router = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => router,
}));

vi.mock('../../components/song-list/SongList.vue', () => ({
  default: defineComponent({
    name: 'SongList',
    setup() {
      return () => h('div', { 'data-testid': 'song-list' }, 'Song list content');
    },
  }),
}));

describe('SongLibrary', () => {
  it('renders the songs library layout with navigation and song list', () => {
    render(SongLibrary);

    expect(screen.getByTestId('song-library-view')).toBeInTheDocument();
    expect(pageNavigation.value.pageTitle).toBe('Knihovna');
    expect(screen.getByTestId('song-list')).toBeInTheDocument();
  });

  it('navigates to the create song page from the page action', async () => {
    render(SongLibrary);

    await fireEvent.click(screen.getByRole('button', { name: 'Vytvořit novou píseň' }));

    expect(router.push).toHaveBeenCalledWith({ path: Routes.SongCreate });
  });
});
