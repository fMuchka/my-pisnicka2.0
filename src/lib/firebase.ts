import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

/**
 * Firebase Initialization Module
 *
 * Handles Firebase SDK initialization with:
 * - Automatic emulator detection in dev/test environments
 * - Environment variable validation with helpful error messages
 * - Free-tier-only service connections (no Cloud Functions)
 *
 * Configuration from `.env.local`:
 * VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
 * VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
 */

/**
 * Validates required environment variables and throws helpful error if missing.
 * This ensures developers get clear guidance when configuration is incomplete.
 */
function requiredEnv(key: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Add it to your .env.local file.`
    );
  }
  return value;
}

const isTest = import.meta.env.MODE === 'test';

/**
 * Emulator Configuration Strategy:
 *
 * Test mode: Use static credentials (Firebase SDK is mocked in vitest.setup.ts)
 * Dev/Prod: Validate and use actual Firebase credentials from env vars
 *
 * This approach avoids env var lookups during testing while ensuring
 * real credentials are always present for dev/prod builds.
 */
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

/**
 * Emulator Connection Logic
 *
 * Automatically connects to local Firebase emulators based on environment:
 * - Always in test mode (unit & e2e with emulators)
 * - In dev mode on localhost (convenient for local development)
 * - When explicitly enabled via VITE_FIREBASE_EMULATOR env var
 * - Can be disabled with VITE_DISABLE_FIREBASE_EMULATOR=true
 *
 * This approach allows seamless switching between emulators and production Firebase
 * without code changes.
 */
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

/**
 * Emulator Connection Initialization
 *
 * - emulatorsConnected flag prevents double-connection (Firebase warns if you try)
 * - Each service (Firestore, Auth, Storage) gets isolated error handling
 * - Ports default to standard values but can be overridden via env vars
 *   (useful for Docker/CI environments with custom port mapping)
 */
let emulatorsConnected = false;

if (USE_FIREBASE_EMULATOR && !emulatorsConnected) {
  emulatorsConnected = true;

  // Allow port override via env vars for flexibility in non-standard environments
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
