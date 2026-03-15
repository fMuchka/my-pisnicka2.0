import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Song interface with WYSIWYG text containing chords above lyrics.
 *
 * Example text format:
 * ```
 * G                D                Am
 *   Mama take this badge off of me
 * G         D               C
 *   I can't use it anymore
 * ```
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  text?: string; // WYSIWYG song text with chord notation (chords above lyrics or inline)
  chords?: string[]; // Array of unique chords (auto-extracted from text, can be manually edited)
  createdAt?: Timestamp; // Firestore Timestamp
}

export interface CreateSongInput {
  title: string;
  artist: string;
  text?: string;
  chords?: string[];
}

export interface UpdateSongInput {
  title: string;
  artist: string;
  text?: string;
  chords?: string[];
}

/**
 * Deterministic song selection for home screen.
 * Rules:
 * - Maximum 6 songs total
 * - Maximum 3 unique artists
 * - Maximum 2 songs per artist
 * - Input must already be sorted by artist ASC, title ASC
 */
export function selectHomeSongs(songs: Song[]): Song[] {
  const result: Song[] = [];
  const artistCounts = new Map<string, number>();
  let artistsIncluded = 0;

  for (const song of songs) {
    // Stop if we already have 6 songs
    if (result.length >= 6) break;

    // Stop if we've included 3 artists and this is a new artist
    if (artistsIncluded >= 3 && !artistCounts.has(song.artist)) break;

    // Get count for this artist (0 if not seen yet)
    const count = artistCounts.get(song.artist) || 0;

    // Skip if this artist already has 2 songs
    if (count >= 2) continue;

    // Add song and update counts
    result.push(song);
    artistCounts.set(song.artist, count + 1);

    // Track unique artists
    if (count === 0) {
      artistsIncluded++;
    }
  }

  return result;
}

/**
 * Fetch songs for home screen from Firestore.
 * Queries up to 30 songs ordered by artist ASC, title ASC,
 * then applies selectHomeSongs filtering.
 */
export async function fetchHomeSongs(): Promise<Song[]> {
  const songsRef = collection(db, 'songs');
  const q = query(songsRef, orderBy('artist', 'asc'), orderBy('title', 'asc'), limit(30));

  const snapshot = await getDocs(q);
  // DRY: Song mapping shape is repeated here and in fetchSongById.
  // PATTERN: Extract a shared mapSongDoc helper to keep schema changes centralized.
  // See: https://www.typescriptlang.org/docs/handbook/2/functions.html
  const allSongs = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      artist: data.artist,
      text: data.text,
      chords: data.chords,
      createdAt: data.createdAt,
    } as Song;
  });

  return selectHomeSongs(allSongs);
}

export async function fetchSongById(songId: string): Promise<Song | null> {
  const songRef = doc(db, 'songs', songId);
  const songSnapshot = await getDoc(songRef);

  if (!songSnapshot.exists()) {
    return null;
  }

  const data = songSnapshot.data();

  // DRY: Keep this mapping consistent with fetchHomeSongs via one mapper function.
  return {
    id: songSnapshot.id,
    title: data.title,
    artist: data.artist,
    text: data.text,
    chords: data.chords,
    createdAt: data.createdAt,
  } as Song;
}

export const createSong = async (input: CreateSongInput): Promise<Song> => {
  const songData: Omit<Song, 'id'> = {
    title: input.title,
    artist: input.artist,
    chords: input.chords,
    text: input.text,
    createdAt: Timestamp.now(),
  };

  const songRef = await addDoc(collection(db, 'songs'), songData);

  return {
    id: songRef.id,
    ...songData,
  };
};

export const updateSong = async (songId: string, input: UpdateSongInput): Promise<Song> => {
  const songRef = doc(db, 'songs', songId);
  const songData: UpdateSongInput = {
    title: input.title,
    artist: input.artist,
    text: input.text,
    chords: input.chords,
  };

  // PATTERN: Double assertion weakens type guarantees.
  // KIS: Prefer a narrowly typed update payload compatible with Firestore updateDoc.
  // See: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
  await updateDoc(songRef, songData as unknown as { [x: string]: unknown });

  return {
    id: songId,
    ...songData,
  };
};
