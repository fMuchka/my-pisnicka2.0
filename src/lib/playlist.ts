import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  Timestamp,
  updateDoc,
  where,
  orderBy,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export type PlaylistVisibility = 'private' | 'public';

export interface Playlist {
  id: string;
  name: string;
  ownerId: string;
  visibility: PlaylistVisibility;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PlaylistSongRef {
  id: string;
  sourceSongId: string;
  position: number;
  addedAt?: Timestamp;
}

export interface CreatePlaylistInput {
  name: string;
  ownerId: string;
  visibility?: PlaylistVisibility;
}

const normalizePlaylistName = (name: string): string => name.trim();

const mapPlaylist = (snapshotDoc: QueryDocumentSnapshot<DocumentData, DocumentData>): Playlist => {
  const data = snapshotDoc.data();
  const visibility = data.visibility === 'public' ? 'public' : 'private';

  return {
    id: snapshotDoc.id,
    name: typeof data.name === 'string' ? data.name : '',
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    visibility,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const mapPlaylistSongRef = (
  snapshotDoc: QueryDocumentSnapshot<DocumentData, DocumentData>
): PlaylistSongRef => {
  const data = snapshotDoc.data();

  return {
    id: snapshotDoc.id,
    sourceSongId: typeof data.sourceSongId === 'string' ? data.sourceSongId : '',
    position: typeof data.position === 'number' ? data.position : 0,
    addedAt: data.addedAt,
  };
};

const byUpdatedAtDesc = (a: Playlist, b: Playlist): number => {
  const aMs = a.updatedAt?.toMillis() ?? 0;
  const bMs = b.updatedAt?.toMillis() ?? 0;

  return bMs - aMs;
};

export async function fetchUserPlaylists(ownerId: string): Promise<Playlist[]> {
  const playlistQuery = query(collection(db, 'playlists'), where('ownerId', '==', ownerId));
  const snapshot = await getDocs(playlistQuery);

  return snapshot.docs.map(mapPlaylist).sort(byUpdatedAtDesc);
}

export async function fetchPublicPlaylists(excludeOwnerId?: string): Promise<Playlist[]> {
  const playlistQuery = query(collection(db, 'playlists'), where('visibility', '==', 'public'));
  const snapshot = await getDocs(playlistQuery);

  return snapshot.docs
    .map(mapPlaylist)
    .filter((playlist) => (excludeOwnerId ? playlist.ownerId !== excludeOwnerId : true))
    .sort(byUpdatedAtDesc);
}

export async function createPlaylist(input: CreatePlaylistInput): Promise<Playlist> {
  const name = normalizePlaylistName(input.name);

  if (name.length === 0) {
    throw new Error('Playlist name must not be empty.');
  }

  const now = Timestamp.now();
  const visibility = input.visibility ?? 'private';

  const payload = {
    name,
    ownerId: input.ownerId,
    visibility,
    createdAt: now,
    updatedAt: now,
  };

  const created = await addDoc(collection(db, 'playlists'), payload);

  return {
    id: created.id,
    ...payload,
  };
}

export async function updatePlaylistVisibility(
  playlistId: string,
  visibility: PlaylistVisibility
): Promise<void> {
  const playlistRef = doc(db, 'playlists', playlistId);

  await updateDoc(playlistRef, {
    visibility,
    updatedAt: Timestamp.now(),
  });
}

export async function fetchPlaylistSongRefs(playlistId: string): Promise<PlaylistSongRef[]> {
  const songsQuery = query(
    collection(db, 'playlists', playlistId, 'songs'),
    orderBy('position', 'asc')
  );
  const snapshot = await getDocs(songsQuery);

  return snapshot.docs.map(mapPlaylistSongRef).filter((songRef) => songRef.sourceSongId.length > 0);
}

export async function addSongToPlaylist(
  playlistId: string,
  sourceSongId: string
): Promise<boolean> {
  const songsCollection = collection(db, 'playlists', playlistId, 'songs');
  const existingQuery = query(songsCollection, where('sourceSongId', '==', sourceSongId), limit(1));
  const existingSnapshot = await getDocs(existingQuery);

  if (existingSnapshot.docs.length > 0) {
    return false;
  }

  const maxPositionQuery = query(songsCollection, orderBy('position', 'desc'), limit(1));
  const maxPositionSnapshot = await getDocs(maxPositionQuery);
  const currentMax = maxPositionSnapshot.docs[0]?.data().position;
  const nextPosition = typeof currentMax === 'number' ? currentMax + 1 : 0;

  await addDoc(songsCollection, {
    sourceSongId,
    position: nextPosition,
    addedAt: Timestamp.now(),
  });

  await updateDoc(doc(db, 'playlists', playlistId), {
    updatedAt: Timestamp.now(),
  });

  return true;
}

export async function removeSongFromPlaylist(
  playlistId: string,
  playlistSongRefId: string
): Promise<void> {
  await deleteDoc(doc(db, 'playlists', playlistId, 'songs', playlistSongRefId));

  await updateDoc(doc(db, 'playlists', playlistId), {
    updatedAt: Timestamp.now(),
  });
}
