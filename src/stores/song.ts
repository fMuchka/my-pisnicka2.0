import { create } from 'zustand';
import type { Song, CreateSongInput, UpdateSongInput } from '../lib/song';
import * as songStorage from '../lib/songStorage';

type SongState = {
  songs: Map<string, Song>;
  getSong: (id: string) => Promise<Song | null>;
  refreshSong: (id: string) => Promise<Song | null>;
  createSong: (input: CreateSongInput) => Promise<Song>;
  updateSong: (id: string, input: UpdateSongInput) => Promise<Song>;
  refreshAllSongs: () => Promise<Song[]>;
  loadSongsFromCache: () => Promise<boolean>;
  fetchAllSongsIntoStore: () => Promise<void>;
};

// Zustand only notices a new Map, not a mutated one.
const withSongs = (current: Map<string, Song>, songs: Song[]) => {
  const next = new Map(current);
  for (const song of songs) {
    next.set(song.id, song);
  }
  return next;
};

export const useSongStore = create<SongState>()((set, get) => ({
  songs: new Map(),

  async getSong(id) {
    const cached = get().songs.get(id);
    if (cached !== undefined) {
      return cached;
    }

    const song = await songStorage.getSong(id);
    if (song !== null) {
      set((state) => ({ songs: withSongs(state.songs, [song]) }));
    }
    return song;
  },

  async refreshSong(id) {
    const song = await songStorage.forceFetchSong(id);
    if (song !== null) {
      set((state) => ({ songs: withSongs(state.songs, [song]) }));
    } else {
      set((state) => {
        const next = new Map(state.songs);
        next.delete(id);
        return { songs: next };
      });
    }
    return song;
  },

  async createSong(input) {
    const song = await songStorage.createSong(input);
    set((state) => ({ songs: withSongs(state.songs, [song]) }));
    return song;
  },

  async updateSong(id, input) {
    const song = await songStorage.updateSong(id, input);
    set((state) => ({ songs: withSongs(state.songs, [song]) }));
    return song;
  },

  async refreshAllSongs() {
    const fetched = await songStorage.forceFetchAllSongs();
    set({ songs: withSongs(new Map(), fetched) });
    return fetched;
  },

  async loadSongsFromCache() {
    const cached = await songStorage.getAllSongsFromCache();
    if (cached.length === 0) return false;
    set((state) => ({ songs: withSongs(state.songs, cached) }));
    return true;
  },

  async fetchAllSongsIntoStore() {
    const fetched = await songStorage.forceFetchAllSongs();
    set((state) => ({ songs: withSongs(state.songs, fetched) }));
  },
}));
