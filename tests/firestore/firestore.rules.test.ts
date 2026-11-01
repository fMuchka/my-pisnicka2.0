import fs from 'fs';
import path from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { describe, it, beforeEach, beforeAll, afterAll } from 'vitest';

const PROJECT_ID = 'my-pisnicka-rules-tests';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const [host, portRaw] = FIRESTORE_HOST.split(':');
const port = Number(portRaw);
const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

let testEnv: RulesTestEnvironment;

const authedDb = (uid: string) => testEnv.authenticatedContext(uid).firestore();
const guestDb = () => testEnv.unauthenticatedContext().firestore();

describe('firestore.rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host,
        port,
        rules,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('allows creating songs document with heavy-data shape', async () => {
    const db = authedDb('user-a');

    await assertSucceeds(
      setDoc(doc(db, 'songs/song-1'), {
        text: '[Verse] [G] Lyrics',
        createdAt: Timestamp.now(),
        ownerId: 'user-a',
      })
    );
  });

  it('allows creating songs document with chords field during transition', async () => {
    const db = authedDb('user-a');

    await assertSucceeds(
      setDoc(doc(db, 'songs/song-1'), {
        text: '[Verse] [G] Lyrics',
        chords: ['G', 'D'],
        createdAt: Timestamp.now(),
        ownerId: 'user-a',
      })
    );
  });

  it('allows creating songs document with title and artist fields during transition', async () => {
    const db = authedDb('user-a');

    await assertSucceeds(
      setDoc(doc(db, 'songs/song-1'), {
        title: 'Legacy title',
        artist: 'Legacy artist',
        text: 'Lyrics',
        createdAt: Timestamp.now(),
        ownerId: 'user-a',
      })
    );
  });

  it('allows saving which instrument the chords are written for', async () => {
    const db = authedDb('user-a');

    await assertSucceeds(
      setDoc(doc(db, 'songs/song-1'), {
        text: 'Lyrics',
        instrument: 'ukulele',
        createdAt: Timestamp.now(),
        ownerId: 'user-a',
      })
    );
  });

  it('denies an unknown instrument', async () => {
    const db = authedDb('user-a');

    await assertFails(
      setDoc(doc(db, 'songs/song-1'), {
        text: 'Lyrics',
        instrument: 'banjo',
        createdAt: Timestamp.now(),
        ownerId: 'user-a',
      })
    );
  });

  it('denies updating songs ownerId', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'songs/song-1'), {
        text: 'Original',
        createdAt: Timestamp.now(),
        ownerId: 'user-a',
      });
    });

    const db = authedDb('user-a');

    await assertFails(
      updateDoc(doc(db, 'songs/song-1'), {
        text: 'Updated',
        ownerId: 'user-b',
      })
    );
  });

  it('allows creating songCatalog entry with valid metadata and sourceSongId', async () => {
    const db = authedDb('user-a');

    await assertSucceeds(
      setDoc(doc(db, 'songCatalog/catalog-1'), {
        sourceSongId: 'song-1',
        title: 'Song title',
        artist: 'Artist name',
        chords: ['G', 'D'],
        ownerId: 'user-a',
      })
    );
  });

  it('denies creating songCatalog entry with invalid chords type', async () => {
    const db = authedDb('user-a');

    await assertFails(
      setDoc(doc(db, 'songCatalog/catalog-1'), {
        sourceSongId: 'song-1',
        title: 'Song title',
        artist: 'Artist name',
        chords: 'G,D',
        ownerId: 'user-a',
      })
    );
  });

  it('denies creating songCatalog entry without sourceSongId', async () => {
    const db = authedDb('user-a');

    await assertFails(
      setDoc(doc(db, 'songCatalog/catalog-1'), {
        title: 'Song title',
        artist: 'Artist name',
        ownerId: 'user-a',
      })
    );
  });

  it('denies changing songCatalog sourceSongId during update', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'songCatalog/catalog-1'), {
        sourceSongId: 'song-1',
        title: 'Song title',
        artist: 'Artist name',
        ownerId: 'user-a',
      });
    });

    const db = authedDb('user-a');

    await assertFails(
      updateDoc(doc(db, 'songCatalog/catalog-1'), {
        sourceSongId: 'song-2',
      })
    );
  });

  it('allows deleting own songCatalog entry', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'songCatalog/catalog-1'), {
        sourceSongId: 'song-1',
        title: 'Song title',
        artist: 'Artist name',
        ownerId: 'user-a',
      });
    });

    const db = authedDb('user-a');

    await assertSucceeds(deleteDoc(doc(db, 'songCatalog/catalog-1')));
  });

  it('allows owner to create playlist and add playlist song', async () => {
    const db = authedDb('user-a');

    await assertSucceeds(
      setDoc(doc(db, 'playlists/playlist-1'), {
        name: 'My Playlist',
        ownerId: 'user-a',
        visibility: 'private',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    );

    await assertSucceeds(
      setDoc(doc(db, 'playlists/playlist-1/songs/ref-1'), {
        sourceSongId: 'song-1',
        position: 0,
        addedAt: Timestamp.now(),
      })
    );
  });

  it('denies reading private playlist to non-owner', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'playlists/playlist-1'), {
        name: 'Private Playlist',
        ownerId: 'user-a',
        visibility: 'private',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await assertFails(getDoc(doc(authedDb('user-b'), 'playlists/playlist-1')));
  });

  it('allows reading public playlist to non-owner and guest', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'playlists/playlist-1'), {
        name: 'Public Playlist',
        ownerId: 'user-a',
        visibility: 'public',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await assertSucceeds(getDoc(doc(authedDb('user-b'), 'playlists/playlist-1')));
    await assertSucceeds(getDoc(doc(guestDb(), 'playlists/playlist-1')));
  });

  it('denies adding playlist song to playlist owned by another user', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'playlists/playlist-1'), {
        name: 'Owned by A',
        ownerId: 'user-a',
        visibility: 'public',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await assertFails(
      setDoc(doc(authedDb('user-b'), 'playlists/playlist-1/songs/ref-1'), {
        sourceSongId: 'song-1',
        position: 0,
        addedAt: Timestamp.now(),
      })
    );
  });
});
