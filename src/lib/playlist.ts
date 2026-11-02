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
  writeBatch,
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

export interface UpdatePlaylistInput {
  name: string;
  visibility: PlaylistVisibility;
}

export async function updatePlaylist(
  playlistId: string,
  input: UpdatePlaylistInput
): Promise<UpdatePlaylistInput> {
  const name = normalizePlaylistName(input.name);

  if (name.length === 0) {
    throw new Error('Playlist name must not be empty.');
  }

  const changes = { name, visibility: input.visibility };

  await updateDoc(doc(db, 'playlists', playlistId), {
    ...changes,
    updatedAt: Timestamp.now(),
  });

  return changes;
}

/** Deletes the playlist together with its song refs; the songs themselves stay. */
export async function deletePlaylist(playlistId: string): Promise<void> {
  const songsSnapshot = await getDocs(collection(db, 'playlists', playlistId, 'songs'));
  const batch = writeBatch(db);

  // The rules check song ref deletes against the playlist as it was before the batch,
  // so the playlist can go in the same batch.
  for (const songDoc of songsSnapshot.docs) {
    batch.delete(songDoc.ref);
  }
  batch.delete(doc(db, 'playlists', playlistId));

  await batch.commit();
}

/** Renumbers the playlist's song refs to follow the given order. */
export async function reorderPlaylistSongs(
  playlistId: string,
  orderedSongRefIds: string[]
): Promise<void> {
  const batch = writeBatch(db);

  orderedSongRefIds.forEach((songRefId, position) => {
    batch.update(doc(db, 'playlists', playlistId, 'songs', songRefId), { position });
  });
  batch.update(doc(db, 'playlists', playlistId), { updatedAt: Timestamp.now() });

  await batch.commit();
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
