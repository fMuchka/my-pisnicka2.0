import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill ResizeObserver for jsdom (needed by Ark UI components)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

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

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    connectFirestoreEmulator: vi.fn(),
  };
});

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  connectStorageEmulator: vi.fn(),
}));
