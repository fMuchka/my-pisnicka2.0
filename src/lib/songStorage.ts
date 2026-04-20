import { Timestamp } from 'firebase/firestore';
import {
  type Song,
  type CreateSongInput,
  type UpdateSongInput,
  fetchSongById,
  fetchAllSongs,
  createSong as firestoreCreateSong,
  updateSong as firestoreUpdateSong,
} from './song';
import {
  getRecord,
  getAllRecords,
  putRecord,
  deleteRecord,
  clearStore,
} from './indexedDB/idbHelper';
import { STORES } from './indexedDB/config';

// Firestore Timestamp instances cannot be round-tripped through IndexedDB's structured clone,
// so we store createdAt as milliseconds and convert on read.
type StoredSong = Omit<Song, 'createdAt'> & { createdAt?: number };

function toStoredSong(song: Song): StoredSong {
  const { createdAt, ...rest } = song;
  const stored: StoredSong = { ...rest };
  if (createdAt !== undefined) {
    stored.createdAt = createdAt.toMillis();
  }
  return stored;
}

function fromStoredSong(stored: StoredSong): Song {
  const { createdAt, ...rest } = stored;
  const song: Song = { ...rest };
  if (createdAt !== undefined) {
    song.createdAt = Timestamp.fromMillis(createdAt);
  }
  return song;
}

export async function getSong(id: string): Promise<Song | null> {
  const stored = await getRecord<StoredSong>(STORES.SONGS, id);
  if (stored !== undefined) {
    return fromStoredSong(stored);
  }

  const song = await fetchSongById(id);
  if (song !== null) {
    await putRecord(STORES.SONGS, toStoredSong(song));
  }
  return song;
}

export async function forceFetchSong(id: string): Promise<Song | null> {
  const song = await fetchSongById(id);
  if (song !== null) {
    await putRecord(STORES.SONGS, toStoredSong(song));
  }
  return song;
}

export async function createSong(input: CreateSongInput): Promise<Song> {
  const song = await firestoreCreateSong(input);
  await putRecord(STORES.SONGS, toStoredSong(song));
  return song;
}

export async function updateSong(id: string, input: UpdateSongInput): Promise<Song> {
  const song = await firestoreUpdateSong(id, input);
  await putRecord(STORES.SONGS, toStoredSong(song));
  return song;
}

export async function getAllSongsFromCache(): Promise<Song[]> {
  const stored = await getAllRecords<StoredSong>(STORES.SONGS);
  return stored.map(fromStoredSong);
}

export async function forceFetchAllSongs(): Promise<Song[]> {
  const songs = await fetchAllSongs();
  await clearStore(STORES.SONGS);
  await Promise.all(songs.map((song) => putRecord(STORES.SONGS, toStoredSong(song))));
  return songs;
}

export async function removeSong(id: string): Promise<void> {
  await deleteRecord(STORES.SONGS, id);
}
