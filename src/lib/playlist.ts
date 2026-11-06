import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
  orderBy,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
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

export type PlaylistWithSongs = Playlist & { songRefs: PlaylistSongRef[] };

/** The signed-in user's own playlists, or everyone else's public ones. */
export type PlaylistScope = 'mine' | 'public';

// By name rather than by last change: the list is live, and a playlist jumping to the top while
// songs are added to it would pull it from under the user.
const byName = (a: Playlist, b: Playlist) =>
  a.name.localeCompare(b.name, 'cs', { sensitivity: 'base' });

/**
 * Keeps `onChange` up to date with the playlists of `scope`, each with its songs in playlist
 * order. Calls back once every playlist's songs have arrived, then on every change.
 */
export function subscribeToPlaylists(
  scope: PlaylistScope,
  userId: string,
  onChange: (playlists: PlaylistWithSongs[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const playlistQuery =
    scope === 'mine'
      ? query(collection(db, 'playlists'), where('ownerId', '==', userId))
      : query(collection(db, 'playlists'), where('visibility', '==', 'public'));

  let playlists: Playlist[] | null = null;
  const songRefs = new Map<string, PlaylistSongRef[]>();
  const songListeners = new Map<string, Unsubscribe>();

  const emit = () => {
    if (playlists === null || playlists.some((playlist) => !songRefs.has(playlist.id))) return;
    onChange(
      playlists.map((playlist) => ({ ...playlist, songRefs: songRefs.get(playlist.id) ?? [] }))
    );
  };

  const listenToSongs = (playlistId: string) =>
    onSnapshot(
      query(collection(db, 'playlists', playlistId, 'songs'), orderBy('position', 'asc')),
      (snapshot) => {
        songRefs.set(
          playlistId,
          snapshot.docs.map(mapPlaylistSongRef).filter((ref) => ref.sourceSongId.length > 0)
        );
        emit();
      },
      () => {
        // A deleted playlist's songs stop being readable, sometimes before the playlist's
        // removal arrives. It goes away with that; until then it just shows no songs.
        songRefs.set(playlistId, []);
        emit();
      }
    );

  const stopPlaylists = onSnapshot(
    playlistQuery,
    (snapshot) => {
      playlists = snapshot.docs
        .map(mapPlaylist)
        .filter((playlist) => scope === 'mine' || playlist.ownerId !== userId)
        .sort(byName);

      const ids = new Set(playlists.map((playlist) => playlist.id));
      for (const [playlistId, stop] of songListeners) {
        if (!ids.has(playlistId)) {
          stop();
          songListeners.delete(playlistId);
          songRefs.delete(playlistId);
        }
      }
      for (const playlist of playlists) {
        if (!songListeners.has(playlist.id)) {
          songListeners.set(playlist.id, listenToSongs(playlist.id));
        }
      }

      emit();
    },
    onError
  );

  return () => {
    stopPlaylists();
    songListeners.forEach((stop) => stop());
  };
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
