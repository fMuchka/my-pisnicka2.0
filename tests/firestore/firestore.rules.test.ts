import fs from 'fs';
import path from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { describe, it, beforeEach, beforeAll, afterAll } from 'vitest';

const PROJECT_ID = 'my-pisnicka-rules-tests';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const [host, portRaw] = FIRESTORE_HOST.split(':');
const port = Number(portRaw);
const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

let testEnv: RulesTestEnvironment;

const authedDb = (uid: string) => testEnv.authenticatedContext(uid).firestore();

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
});
