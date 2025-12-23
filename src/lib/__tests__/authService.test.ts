import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { IdTokenResult } from 'firebase/auth';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase Auth SDK mocks for unit tests
vi.mock('firebase/auth', () => {
  return {
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  };
});

// Mock the firebase config module to avoid env variable issues in tests
vi.mock('../firebase', () => ({
  auth: {}, // Mock auth instance
}));

// Import the service under test (will be implemented by developer)
import { loginWithEmailPassword, signOut as signOutService } from '../authService';

const mockedSignIn = signInWithEmailAndPassword as Mock;
const mockedSignOut = signOut as Mock;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage between tests
  });

  describe('loginWithEmailPassword', () => {
    it('calls Firebase signInWithEmailAndPassword with correct params', async () => {
      const email = 'host@host';
      const password = 'secret123';
      vi.mocked(mockedSignIn).mockResolvedValue({
        user: {
          uid: 'u1',
          email,
          emailVerified: false,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: function (): Promise<void> {
            throw new Error('Function not implemented.');
          },
          getIdToken: function (_forceRefresh?: boolean): Promise<string> {
            throw new Error('Function not implemented.');
          },
          getIdTokenResult: function (_forceRefresh?: boolean): Promise<IdTokenResult> {
            throw new Error('Function not implemented.');
          },
          reload: function (): Promise<void> {
            throw new Error('Function not implemented.');
          },
          toJSON: function (): object {
            throw new Error('Function not implemented.');
          },
          displayName: null,
          phoneNumber: null,
          photoURL: null,
          providerId: '',
        },
        providerId: null,
        operationType: 'link',
      });

      const user = await loginWithEmailPassword(email, password);

      expect(mockedSignIn).toHaveBeenCalledTimes(1);
      expect(mockedSignIn).toHaveBeenCalledWith(expect.anything(), email, password);
      expect(user).toMatchObject({ uid: 'u1', email });
    });

    it('returns user on success', async () => {
      vi.mocked(mockedSignIn).mockResolvedValue({
        user: {
          uid: 'abc',
          email: 'x@y',
          emailVerified: false,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: function (): Promise<void> {
            throw new Error('Function not implemented.');
          },
          getIdToken: function (_forceRefresh?: boolean): Promise<string> {
            throw new Error('Function not implemented.');
          },
          getIdTokenResult: function (_forceRefresh?: boolean): Promise<IdTokenResult> {
            throw new Error('Function not implemented.');
          },
          reload: function (): Promise<void> {
            throw new Error('Function not implemented.');
          },
          toJSON: function (): object {
            throw new Error('Function not implemented.');
          },
          displayName: null,
          phoneNumber: null,
          photoURL: null,
          providerId: '',
        },
        providerId: null,
        operationType: 'link',
      });
      const user = await loginWithEmailPassword('x@y', 'pw');
      expect(user).toMatchObject({ uid: 'abc', email: 'x@y' });
    });

    it('throws error on invalid credentials', async () => {
      const err = Object.assign(new Error('Invalid credentials'), {
        code: 'auth/invalid-credential',
      });
      vi.mocked(mockedSignIn).mockRejectedValue(err);

      await expect(loginWithEmailPassword('bad@host', 'wrong')).rejects.toMatchObject({
        code: 'auth/invalid-credential',
      });
    });
  });

  describe('signOut', () => {
    it('calls Firebase signOut', async () => {
      vi.mocked(mockedSignOut).mockResolvedValue(void 0);
      await signOutService();
      expect(mockedSignOut).toHaveBeenCalledTimes(1);
      expect(mockedSignOut).toHaveBeenCalledWith(expect.anything());
    });
  });
});
