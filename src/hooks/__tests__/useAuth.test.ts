import { describe, it, expect, vi, beforeEach, type Mock, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock onAuthStateChanged and other Firebase Auth bits
vi.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: vi.fn(),
    getAuth: vi.fn(),
  };
});

// Mock authService.signOut used by the hook
vi.mock('../../lib/authService', () => ({
  signOut: vi.fn(async () => {}),
}));

import { onAuthStateChanged } from 'firebase/auth';
import { signOut as signOutService } from '../../lib/authService';
import { logout, useAuth } from '../useAuth';

const mockOnAuthStateChanged = onAuthStateChanged as Mock;

const captureAuthListener = () => {
  let handler: (u: unknown) => void = () => {};
  vi.mocked(mockOnAuthStateChanged).mockImplementation((_auth, cb) => {
    handler = cb;
    return () => {};
  });
  return (user: unknown) => act(() => handler(user));
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await logout();
  });

  it('user is initially null', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('isAuthenticated returns false when user is null', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('isAuthenticated returns true when user exists', () => {
    const emit = captureAuthListener();

    const { result } = renderHook(() => useAuth());
    emit({ uid: 'u1', email: 'x@y' });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('isGuest returns true when user is not logged in', () => {
    vi.mocked(mockOnAuthStateChanged).mockImplementation(() => () => {});

    const { result } = renderHook(() => useAuth());
    expect(result.current.isGuest).toBe(true);
  });

  it('logout() calls authService.signOut and clears user', async () => {
    const emit = captureAuthListener();
    const { result } = renderHook(() => useAuth());
    emit({ uid: 'u1', email: 'x@y' });
    expect(result.current.user).toMatchObject({ uid: 'u1' });

    await act(() => result.current.logout());
    expect(signOutService).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });

  it('onAuthStateChanged listener updates user state when Firebase auth changes', () => {
    const emit = captureAuthListener();

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    emit({ uid: 'u99', email: 'user@host' });
    expect(result.current.user).toMatchObject({ uid: 'u99', email: 'user@host' });
  });
});
