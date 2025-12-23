import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Firebase config is read from Vite env variables.
// Create a `.env.local` or `.env` with the following keys:
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
// VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID

function requiredEnv(key: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Add it to your .env.local file.`
    );
  }
  return value;
}

const isTest = import.meta.env.MODE === 'test';

// During unit tests we provide a harmless static config to avoid env lookups
// while still letting the module load; runtime Firebase is mocked in vitest setup.
const firebaseConfig = isTest
  ? {
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project',
      storageBucket: 'test-bucket',
      messagingSenderId: 'test-sender',
      appId: 'test-app-id',
    }
  : {
      apiKey: requiredEnv('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY as string),
      authDomain: requiredEnv(
        'VITE_FIREBASE_AUTH_DOMAIN',
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string
      ),
      projectId: requiredEnv(
        'VITE_FIREBASE_PROJECT_ID',
        import.meta.env.VITE_FIREBASE_PROJECT_ID as string
      ),
      storageBucket: requiredEnv(
        'VITE_FIREBASE_STORAGE_BUCKET',
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string
      ),
      messagingSenderId: requiredEnv(
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string
      ),
      appId: requiredEnv('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID as string),
    };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const explicitEmulatorFlag =
  import.meta.env.VITE_FIREBASE_EMULATOR === 'true' ||
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const explicitDisableFlag = import.meta.env.VITE_DISABLE_FIREBASE_EMULATOR === 'true';

const runningOnLocalhost =
  typeof window !== 'undefined' &&
  window.location &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const USE_FIREBASE_EMULATOR =
  !explicitDisableFlag &&
  (isTest || explicitEmulatorFlag || (import.meta.env.DEV && runningOnLocalhost));

let emulatorsConnected = false;

if (USE_FIREBASE_EMULATOR && !emulatorsConnected) {
  emulatorsConnected = true;

  const firestoreHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST ?? 'localhost';
  const firestorePort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT ?? 8080);
  const authHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? 'localhost';
  const authPort = Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT ?? 9099);
  const storageHost = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST ?? 'localhost';
  const storagePort = Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT ?? 9199);

  try {
    connectFirestoreEmulator(db, firestoreHost, firestorePort);
  } catch (error) {
    console.warn('Failed to connect Firestore emulator:', error);
  }

  try {
    connectAuthEmulator(auth, `http://${authHost}:${authPort}`);
  } catch (error) {
    console.warn('Failed to connect Auth emulator:', error);
  }

  try {
    connectStorageEmulator(storage, storageHost, storagePort);
  } catch (error) {
    console.warn('Failed to connect Storage emulator:', error);
  }
}

export default app;
