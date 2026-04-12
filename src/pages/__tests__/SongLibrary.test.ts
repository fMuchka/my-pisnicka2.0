import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';
import '@testing-library/jest-dom';
import { defineComponent, h } from 'vue';
import SongLibrary from '../SongLibrary.vue';

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

vi.mock('../../components/song-list/SongList.vue', () => ({
  default: defineComponent({
    name: 'SongList',
    setup() {
      return () => h('div', { 'data-testid': 'song-list' }, 'Song list content');
    },
  }),
}));

vi.mock('../../components/dialogs/create-song/CreateSongDialog.vue', () => ({
  default: defineComponent({
    name: 'CreateSongDialog',
    props: {
      open: { type: Boolean, default: false },
    },
    setup(props) {
      return () =>
        props.open ? h('div', { 'data-testid': 'create-song-dialog' }, 'Create song dialog') : null;
    },
  }),
}));

describe('SongLibrary', () => {
  it('renders the songs library layout with navigation and song list', () => {
    render(SongLibrary);

    expect(screen.getByTestId('song-library-view')).toBeInTheDocument();
    expect(screen.getByTestId('top-navigation')).toHaveTextContent('Knihovna');
    expect(screen.getByTestId('song-list')).toBeInTheDocument();
  });

  it('opens the create song dialog from the page action', async () => {
    render(SongLibrary);

    await fireEvent.click(screen.getByRole('button', { name: 'Vytvořit novou píseň' }));

    expect(screen.getByTestId('create-song-dialog')).toBeInTheDocument();
  });
});
