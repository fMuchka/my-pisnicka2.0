import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock onAuthStateChanged and other Firebase Auth bits
vi.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: vi.fn(),
    getAuth: vi.fn(),
  };
});

// Mock authService.signOut used by the composable
vi.mock('../../lib/authService', () => ({
  signOut: vi.fn(async () => {}),
}));

import { onAuthStateChanged } from 'firebase/auth';
import { signOut as signOutService } from '../../lib/authService';

// Import the composable under test (to be implemented by developer)
import { useAuth } from '../useAuth';

const mockOnAuthStateChanged = onAuthStateChanged as Mock;

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('user is reactive and initially null', () => {
    const { user } = useAuth();
    expect(user.value).toBeNull();
  });

  it('isAuthenticated returns false when user is null', () => {
    const { isAuthenticated } = useAuth();
    expect(isAuthenticated.value).toBe(false);
  });

  it('isAuthenticated returns true when user exists', () => {
    let handler: (u: unknown) => void;
    vi.mocked(mockOnAuthStateChanged).mockImplementation((_auth, cb) => {
      handler = cb;
      return () => {};
    });

    const { isAuthenticated } = useAuth();
    handler!({ uid: 'u1', email: 'x@y' });
    expect(isAuthenticated.value).toBe(true);
  });

  it('isHost returns true when user email is @host domain', () => {
    let handler: (u: unknown) => void;
    vi.mocked(mockOnAuthStateChanged).mockImplementation((_auth, cb) => {
      handler = cb;
      return () => {};
    });

    const { isHost } = useAuth();
    handler!({ uid: 'h1', email: 'alice@host' });
    expect(isHost.value).toBe(true);
  });

  it('isGuest returns true when user is anonymous or magic link', () => {
    let handler: (u: unknown) => void;
    vi.mocked(mockOnAuthStateChanged).mockImplementation((_auth, cb) => {
      handler = cb;
      return () => {};
    });

    const state = useAuth();
    handler!({ uid: 'g1', isAnonymous: true });
    expect(state.isGuest.value).toBe(true);

    handler!({
      uid: 'g2',
      email: 'guest@example.com',
      providerData: [{ providerId: 'emailLink' }],
    });
    expect(state.isGuest.value).toBe(true);
  });

  it('logout() calls authService.signOut and clears user', async () => {
    let handler: (u: unknown) => void;
    vi.mocked(mockOnAuthStateChanged).mockImplementation((_auth, cb) => {
      handler = cb;
      return () => {};
    });
    const state = useAuth();
    handler!({ uid: 'u1', email: 'x@y' });
    expect(state.user.value).toMatchObject({ uid: 'u1' });

    await state.logout();
    expect(signOutService).toHaveBeenCalledTimes(1);
    expect(state.user.value).toBeNull();
  });

  it('onAuthStateChanged listener updates user state when Firebase auth changes', () => {
    let handler: (u: unknown) => void;
    vi.mocked(mockOnAuthStateChanged).mockImplementation((_auth, cb) => {
      handler = cb;
      return () => {};
    });

    const { user } = useAuth();
    expect(user.value).toBeNull();
    handler!({ uid: 'u99', email: 'user@host' });
    expect(user.value).toMatchObject({ uid: 'u99', email: 'user@host' });
  });
});
