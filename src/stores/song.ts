import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Song, CreateSongInput, UpdateSongInput } from '../lib/song';
import * as songStorage from '../lib/songStorage';

export const useSongStore = defineStore('song', () => {
  const songs = ref(new Map<string, Song>());

  async function getSong(id: string): Promise<Song | null> {
    const cached = songs.value.get(id);
    if (cached !== undefined) {
      return cached;
    }

    const song = await songStorage.getSong(id);
    if (song !== null) {
      songs.value.set(id, song);
    }
    return song;
  }

  async function refreshSong(id: string): Promise<Song | null> {
    const song = await songStorage.forceFetchSong(id);
    if (song !== null) {
      songs.value.set(id, song);
    } else {
      songs.value.delete(id);
    }
    return song;
  }

  async function createSong(input: CreateSongInput): Promise<Song> {
    const song = await songStorage.createSong(input);
    songs.value.set(song.id, song);
    return song;
  }

  async function updateSong(id: string, input: UpdateSongInput): Promise<Song> {
    const song = await songStorage.updateSong(id, input);
    songs.value.set(id, song);
    return song;
  }

  async function refreshAllSongs(): Promise<Song[]> {
    const fetched = await songStorage.forceFetchAllSongs();
    for (const song of fetched) {
      songs.value.set(song.id, song);
    }
    return fetched;
  }

  async function loadSongsFromCache(): Promise<boolean> {
    const cached = await songStorage.getAllSongsFromCache();
    if (cached.length === 0) return false;
    for (const song of cached) {
      songs.value.set(song.id, song);
    }
    return true;
  }

  async function fetchAllSongsIntoStore(): Promise<void> {
    const fetched = await songStorage.forceFetchAllSongs();
    for (const song of fetched) {
      songs.value.set(song.id, song);
    }
  }

  return {
    songs,
    getSong,
    refreshSong,
    refreshAllSongs,
    loadSongsFromCache,
    fetchAllSongsIntoStore,
    createSong,
    updateSong,
  };
});
