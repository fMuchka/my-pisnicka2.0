import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateSongDialog from '../CreateSongDialog.vue';
import type { Song } from '../../../../lib/song';

const mocks = vi.hoisted(() => ({
  createSong: vi.fn(),
  updateSong: vi.fn(),
}));

type MockRef<T> = { __v_isRef: true; value: T };

function mockRef<T>(value: T): MockRef<T> {
  return {
    __v_isRef: true,
    value,
  };
}

// Mock auth composable - default to authenticated host
const mockUser = vi.hoisted(() => mockRef({ uid: 'host-123', displayName: 'Test Host' }));
const mockIsAuthenticated = vi.hoisted(() => mockRef(true));
vi.mock('../../../../composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

vi.mock('../../../../lib/song', () => ({
  createSong: mocks.createSong,
  updateSong: mocks.updateSong,
}));

vi.mock('../../../song/SongTextEditor.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue', 'unique-chords'],
    template:
      "<textarea data-testid=\"song-text-editor\" :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value); $emit('unique-chords', ['Am', 'C'])\" />",
  },
}));

describe('CreateSongDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables submit for empty required fields', async () => {
    render(CreateSongDialog, {
      props: { open: true },
    });

    const submit = screen.getByTestId('create-song-submit');
    expect(submit).toBeDisabled();
  });

  it('creates a song and emits saved after valid submit', async () => {
    const user = userEvent.setup();
    const createdSong: Song = {
      id: 'song-1',
      title: "Knockin on Heaven's Door",
      artist: 'Bob Dylan',
      text: '[Am] line',
      chords: ['Am', 'C'],
      ownerId: 'host-123',
    };

    mocks.createSong.mockResolvedValue(createdSong);

    const { emitted } = render(CreateSongDialog, {
      props: { open: true },
    });

    await user.type(
      screen.getByPlaceholderText("Např. Knockin' on Heaven's Door"),
      "Knockin on Heaven's Door"
    );
    await user.type(screen.getByPlaceholderText('Např. Bob Dylan'), 'Bob Dylan');
    await user.type(screen.getByTestId('song-text-editor'), 'line');
    await user.click(screen.getByTestId('create-song-submit'));

    await waitFor(() => {
      expect(mocks.createSong).toHaveBeenCalledWith({
        title: "Knockin on Heaven's Door",
        artist: 'Bob Dylan',
        text: 'line',
        chords: ['Am', 'C'],
        ownerId: 'host-123',
      });

      expect(emitted().saved?.[0]).toEqual([createdSong]);
      expect(emitted()['update:open']).toContainEqual([false]);
    });
  });

  it('uses updateSong in edit mode', async () => {
    const user = userEvent.setup();
    const songToEdit: Song = {
      id: 'song-9',
      title: 'Old title',
      artist: 'Old artist',
      text: '[C] old',
      chords: ['C'],
      ownerId: 'host-123',
    };

    mocks.updateSong.mockResolvedValue({
      ...songToEdit,
      title: 'New title',
      artist: 'New artist',
      text: '[Am] new',
      chords: ['Am', 'C'],
      ownerId: 'host-123',
    });

    const { rerender } = render(CreateSongDialog, {
      props: {
        open: false,
        songToEdit,
      },
    });

    await rerender({
      open: true,
      songToEdit,
    });

    const titleInput = screen.getByPlaceholderText("Např. Knockin' on Heaven's Door");
    const artistInput = screen.getByPlaceholderText('Např. Bob Dylan');

    await user.clear(titleInput);
    await user.type(titleInput, 'New title');
    await user.clear(artistInput);
    await user.type(artistInput, 'New artist');
    await user.clear(screen.getByTestId('song-text-editor'));
    await user.type(screen.getByTestId('song-text-editor'), 'new');

    await user.click(screen.getByTestId('create-song-submit'));

    await waitFor(() => {
      expect(mocks.updateSong).toHaveBeenCalledWith('song-9', {
        title: 'New title',
        artist: 'New artist',
        text: 'new',
        chords: ['Am', 'C'],
        ownerId: 'host-123',
      });
    });
  });

  it('shows edit mode heading and submit label', async () => {
    const songToEdit: Song = {
      id: 'song-10',
      title: 'Edit title',
      artist: 'Edit artist',
      text: 'text',
      chords: ['C'],
      ownerId: 'host-123',
    };

    render(CreateSongDialog, {
      props: {
        open: true,
        songToEdit,
      },
    });

    expect(screen.getByText('Upravit píseň')).toBeInTheDocument();
    expect(screen.getByTestId('create-song-submit')).toHaveTextContent('Uložit změny');
  });
});
