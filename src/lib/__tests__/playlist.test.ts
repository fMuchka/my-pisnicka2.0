import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToPlaylists } from '../playlist';

type SnapshotListener = {
  target: string;
  onNext: (snapshot: unknown) => void;
  onError: (error: Error) => void;
  stop: ReturnType<typeof vi.fn>;
};

const listeners: SnapshotListener[] = [];

vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  // Paths and queries become plain strings, so a listener says what it listens to.
  collection: (_db: unknown, ...path: string[]) => path.join('/'),
  query: (target: string, ...constraints: string[]) => [target, ...constraints].join(' '),
  where: (field: string, op: string, value: string) => `${field}${op}${value}`,
  orderBy: (field: string) => `by ${field}`,
  onSnapshot: (
    target: string,
    onNext: SnapshotListener['onNext'],
    onError: SnapshotListener['onError']
  ) => {
    const stop = vi.fn();
    listeners.push({ target, onNext, onError, stop });
    return stop;
  },
}));

vi.mock('../firebase', () => ({ db: {} }));

const snapshot = (docs: { id: string; data: Record<string, unknown> }[]) => ({
  docs: docs.map(({ id, data }) => ({ id, data: () => data })),
});

const playlistDoc = (id: string, name: string, ownerId = 'u1') => ({
  id,
  data: { name, ownerId, visibility: 'public' },
});

const listenerFor = (target: string) => listeners.find((listener) => listener.target === target);

describe('subscribeToPlaylists', () => {
  beforeEach(() => {
    listeners.length = 0;
  });

  it('waits for every playlist’s songs, then lists the playlists by name with their songs', () => {
    const onChange = vi.fn();
    subscribeToPlaylists('mine', 'u1', onChange, vi.fn());

    expect(listeners[0]?.target).toBe('playlists ownerId==u1');
    listeners[0]?.onNext(snapshot([playlistDoc('p1', 'Zima'), playlistDoc('p2', 'Chata')]));
    expect(onChange).not.toHaveBeenCalled();

    listenerFor('playlists/p1/songs by position')?.onNext(
      snapshot([{ id: 'r1', data: { sourceSongId: 's1', position: 0 } }])
    );
    expect(onChange).not.toHaveBeenCalled();

    listenerFor('playlists/p2/songs by position')?.onNext(snapshot([]));

    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'p2', name: 'Chata', songRefs: [] }),
      expect.objectContaining({
        id: 'p1',
        name: 'Zima',
        songRefs: [{ id: 'r1', sourceSongId: 's1', position: 0, addedAt: undefined }],
      }),
    ]);
  });

  it('lists other people’s public playlists, not the user’s own', () => {
    const onChange = vi.fn();
    subscribeToPlaylists('public', 'u1', onChange, vi.fn());

    expect(listeners[0]?.target).toBe('playlists visibility==public');
    listeners[0]?.onNext(snapshot([playlistDoc('p1', 'Moje'), playlistDoc('p2', 'Cizí', 'u2')]));
    listenerFor('playlists/p2/songs by position')?.onNext(snapshot([]));

    expect(listenerFor('playlists/p1/songs by position')).toBeUndefined();
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'p2' })]);
  });

  it('stops listening to the songs of a playlist that went away', () => {
    const onChange = vi.fn();
    subscribeToPlaylists('mine', 'u1', onChange, vi.fn());
    listeners[0]?.onNext(snapshot([playlistDoc('p1', 'Zima')]));
    const songs = listenerFor('playlists/p1/songs by position');
    songs?.onNext(snapshot([]));

    listeners[0]?.onNext(snapshot([]));

    expect(songs?.stop).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('shows a playlist whose songs cannot be read as empty instead of failing', () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    subscribeToPlaylists('mine', 'u1', onChange, onError);
    listeners[0]?.onNext(snapshot([playlistDoc('p1', 'Zima')]));

    listenerFor('playlists/p1/songs by position')?.onError(new Error('permission-denied'));

    expect(onError).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ songRefs: [] })]);
  });

  it('stops every listener on unsubscribe', () => {
    const unsubscribe = subscribeToPlaylists('mine', 'u1', vi.fn(), vi.fn());
    listeners[0]?.onNext(snapshot([playlistDoc('p1', 'Zima')]));

    unsubscribe();

    expect(listeners.every((listener) => listener.stop.mock.calls.length === 1)).toBe(true);
  });
});
