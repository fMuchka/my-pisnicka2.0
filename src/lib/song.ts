import {
  collection,
  query,
  getDocs,
  Timestamp,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  type DocumentData,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { QueryDocumentSnapshot } from 'firebase/firestore/lite';

export interface Song {
  id: string;
  title: string;
  artist: string;
  text?: string; // WYSIWYG song text with chord notation (chords above lyrics or inline)
  chords?: string[]; // Array of unique chords (auto-extracted from text, can be manually edited)
  categories?: string[]; // Array of category ids from songCategories collection
  originalKey?: string;
  capo?: number;
  createdAt?: Timestamp; // Firestore Timestamp
  ownerId: string;
}

// Firestore representation of a song document. The app model keeps title/artist required,
// while Firestore can contain heavy fields only and optional legacy metadata.
export interface SongDocument {
  title?: Song['title'];
  artist?: Song['artist'];
  text?: Song['text'];
  chords?: Song['chords'];
  originalKey?: Song['originalKey'];
  capo?: Song['capo'];
  createdAt?: Song['createdAt'];
  ownerId?: Song['ownerId'];
}

export interface SongCatalogEntry {
  sourceSongId: Song['id'];
  title: Song['title'];
  artist: Song['artist'];
  chords?: Song['chords'];
  categories?: Song['categories'];
  createdAt?: Song['createdAt'];
  id: string;
  ownerId: string;
}

export interface SongCatalogEntryInput {
  sourceSongId: Song['id'];
  title: Song['title'];
  artist: Song['artist'];
  chords?: Song['chords'];
  categories?: Song['categories'];
  createdAt?: Song['createdAt'];
  ownerId: string;
}

export interface SongCategory {
  id: string;
  value: string;
}

export interface CreateSongInput {
  title: string;
  artist: string;
  text?: string;
  chords?: string[];
  capo?: number;
  ownerId: string;
}

export interface UpdateSongInput {
  title: string;
  artist: string;
  text?: string;
  chords?: string[];
  capo?: number;
  ownerId: string;
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

const mapSongDoc = (
  doc: QueryDocumentSnapshot<DocumentData, DocumentData>,
  data: DocumentData
): Song => {
  const songDoc = data as SongDocument;

  return {
    id: doc.id,
    title: songDoc.title ?? '',
    artist: songDoc.artist ?? '',
    text: songDoc.text,
    chords: songDoc.chords,
    originalKey: songDoc.originalKey ?? undefined,
    capo: songDoc.capo ?? undefined,
    createdAt: songDoc.createdAt,
    ownerId: songDoc.ownerId ?? '',
  };
};

const mapSongListDoc = (
  doc: QueryDocumentSnapshot<DocumentData, DocumentData>,
  data: DocumentData
): SongCatalogEntry => {
  const categories = Array.isArray(data.categories)
    ? data.categories.filter((value: unknown): value is string => typeof value === 'string')
    : undefined;

  return {
    id: doc.id,
    sourceSongId: data.sourceSongId,
    title: data.title,
    artist: data.artist,
    chords: data.chords,
    categories,
    createdAt: data.createdAt,
    ownerId: data.ownerId,
  };
};

const normalizeCategoryLabel = (label: string) => label.trim().toLocaleLowerCase('cs');

const normalizeCategoryIds = (categories?: Song['categories']) => {
  if (categories === undefined) {
    return undefined;
  }

  const uniqueIds = new Set(
    categories.map((categoryId) => categoryId.trim()).filter((categoryId) => categoryId.length > 0)
  );

  return [...uniqueIds];
};

export async function fetchAllSongs(): Promise<Song[]> {
  const songsRef = collection(db, 'songs');
  const q = query(songsRef);

  const snapshot = await getDocs(q);
  const allSongs = snapshot.docs.map((doc) => {
    const data = doc.data();
    return mapSongDoc(doc, data);
  });

  return allSongs;
}

export async function fetchAllSongTitlesAndArtists() {
  const songsRef = collection(db, 'songCatalog');
  const q = query(songsRef);

  const snapshot = await getDocs(q);
  const allSongs = snapshot.docs.map((doc) => {
    const data = doc.data();
    return mapSongListDoc(doc, data);
  });

  return allSongs;
}

export async function fetchAllSongCategories(): Promise<SongCategory[]> {
  const categoriesRef = collection(db, 'songCategories');
  const q = query(categoriesRef);

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((snapshotDoc) => {
      const data = snapshotDoc.data();

      if (typeof data.value !== 'string') {
        return null;
      }

      const value = data.value.trim();

      if (value.length === 0) {
        return null;
      }

      return {
        id: snapshotDoc.id,
        value,
      } satisfies SongCategory;
    })
    .filter((category): category is SongCategory => category !== null)
    .sort((a, b) => a.value.localeCompare(b.value, 'cs', { sensitivity: 'base' }));
}

export async function createSongCategory(label: string): Promise<SongCategory> {
  const value = label.trim();

  if (value.length === 0) {
    throw new Error('Category label must not be empty.');
  }

  const categoryRef = collection(db, 'songCategories');
  const existingQuery = query(categoryRef, where('value', '==', value), limit(1));
  const existingSnapshot = await getDocs(existingQuery);
  const existing = existingSnapshot.docs[0];

  if (existing !== undefined) {
    return {
      id: existing.id,
      value,
    };
  }

  const created = await addDoc(categoryRef, { value });

  return {
    id: created.id,
    value,
  };
}

export async function resolveSongCategoryIds(labels: string[]): Promise<string[]> {
  const uniqueLabels: string[] = [];
  const seen = new Set<string>();

  for (const label of labels) {
    const trimmed = label.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const normalized = normalizeCategoryLabel(trimmed);

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    uniqueLabels.push(trimmed);
  }

  if (uniqueLabels.length === 0) {
    return [];
  }

  const existingCategories = await fetchAllSongCategories();
  const categoryIdsByNormalizedLabel = new Map<string, string>(
    existingCategories.map((category) => [normalizeCategoryLabel(category.value), category.id])
  );

  const resolvedIds: string[] = [];

  for (const label of uniqueLabels) {
    const normalized = normalizeCategoryLabel(label);
    const existingId = categoryIdsByNormalizedLabel.get(normalized);

    if (existingId !== undefined) {
      resolvedIds.push(existingId);
      continue;
    }

    const createdCategory = await createSongCategory(label);
    categoryIdsByNormalizedLabel.set(normalized, createdCategory.id);
    resolvedIds.push(createdCategory.id);
  }

  return resolvedIds;
}

export async function fetchSongCatalogEntryBySourceSongId(
  sourceSongId: Song['id']
): Promise<SongCatalogEntry | null> {
  const songsRef = collection(db, 'songCatalog');
  const q = query(songsRef, where('sourceSongId', '==', sourceSongId), limit(1));

  const snapshot = await getDocs(q);
  const first = snapshot.docs[0];

  if (first === undefined) {
    return null;
  }

  return mapSongListDoc(first, first.data());
}

export async function fetchAllUserSongs(ownerId: string): Promise<Song[]> {
  const songsRef = collection(db, 'songs');
  const q = query(songsRef, where('ownerId', '==', ownerId));

  const snapshot = await getDocs(q);
  const allSongs = snapshot.docs.map((doc) => {
    const data = doc.data();
    return mapSongDoc(doc, data);
  });

  return allSongs;
}

export async function fetchSongById(songId: string): Promise<Song | null> {
  const songRef = doc(db, 'songs', songId);
  const songSnapshot = await getDoc(songRef);

  if (!songSnapshot.exists()) {
    return null;
  }

  const data = songSnapshot.data();

  return mapSongDoc(songSnapshot, data);
}

export const createSong = async (input: CreateSongInput): Promise<Song> => {
  const heavySongData: SongDocument = {
    text: input.text,
    createdAt: Timestamp.now(),
    ownerId: input.ownerId,
    ...(input.capo !== undefined ? { capo: input.capo } : {}),
  };

  const songRef = await addDoc(collection(db, 'songs'), heavySongData);

  return {
    id: songRef.id,
    title: input.title,
    artist: input.artist,
    text: heavySongData.text,
    chords: input.chords,
    capo: input.capo,
    createdAt: heavySongData.createdAt,
    ownerId: heavySongData.ownerId ?? input.ownerId,
  };
};

export const createSongCatalogEntry = async (
  input: SongCatalogEntryInput
): Promise<SongCatalogEntry> => {
  const normalizedCategoryIds = normalizeCategoryIds(input.categories);

  const songData = {
    sourceSongId: input.sourceSongId,
    title: input.title,
    artist: input.artist,
    ownerId: input.ownerId,
    ...(input.chords !== undefined ? { chords: input.chords } : {}),
    ...(normalizedCategoryIds !== undefined ? { categories: normalizedCategoryIds } : {}),
  } satisfies Pick<SongCatalogEntry, 'sourceSongId' | 'title' | 'artist' | 'ownerId'> &
    Partial<Pick<SongCatalogEntry, 'chords' | 'categories'>>;

  const songRef = await addDoc(collection(db, 'songCatalog'), songData);

  return {
    id: songRef.id,
    ...songData,
  };
};

export const updateSongCatalogEntry = async (
  catalogEntryId: string,
  input: SongCatalogEntryInput
): Promise<SongCatalogEntry> => {
  const songRef = doc(db, 'songCatalog', catalogEntryId);
  const normalizedCategoryIds = normalizeCategoryIds(input.categories);

  const songData = {
    title: input.title,
    artist: input.artist,
    sourceSongId: input.sourceSongId,
    ownerId: input.ownerId,
    ...(input.chords !== undefined ? { chords: input.chords } : {}),
    ...(normalizedCategoryIds !== undefined ? { categories: normalizedCategoryIds } : {}),
  } satisfies Pick<SongCatalogEntryInput, 'title' | 'artist' | 'sourceSongId' | 'ownerId'> &
    Partial<Pick<SongCatalogEntryInput, 'chords' | 'categories'>>;

  await updateDoc(songRef, songData as DocumentData);

  return {
    id: catalogEntryId,
    ...songData,
  };
};

export const updateSong = async (songId: string, input: UpdateSongInput): Promise<Song> => {
  const songRef = doc(db, 'songs', songId);
  const heavySongPatch: SongDocument = {
    text: input.text,
    ownerId: input.ownerId,
    ...(input.capo !== undefined ? { capo: input.capo } : {}),
  };

  await updateDoc(songRef, heavySongPatch as DocumentData);

  return {
    id: songId,
    title: input.title,
    artist: input.artist,
    text: heavySongPatch.text,
    chords: input.chords,
    capo: input.capo,
    ownerId: heavySongPatch.ownerId ?? input.ownerId,
  };
};
