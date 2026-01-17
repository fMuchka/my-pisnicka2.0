import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Force Firebase to point to local emulators in test runs.
vi.stubEnv('VITE_FIREBASE_EMULATOR', 'true');
vi.stubEnv('VITE_DISABLE_FIREBASE_EMULATOR', 'false');

// Mock Firebase SDK modules so no real network calls execute in unit tests.
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  connectStorageEmulator: vi.fn(),
}));
