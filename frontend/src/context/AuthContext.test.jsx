import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn()
  }
}));

const STORAGE_KEY = 'mm-auth';

const setNavigatorOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value
  });
  window.dispatchEvent(new Event(value ? 'online' : 'offline'));
};

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setNavigatorOnline(true);
  });

  it('hydrates persisted session data when offline', async () => {
    setNavigatorOnline(false);
    const persisted = {
      user: { id: 'user-1', email: 'athlete@test.com', role: 'user' },
      tokens: { accessToken: 'stored-access', refreshToken: 'stored-refresh' },
      savedAt: 42
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toMatchObject(persisted.user);
    expect(result.current.tokens).toEqual(persisted.tokens);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isOnline).toBe(false);
    expect(api.refresh).not.toHaveBeenCalled();
  });

  it('normalizes legacy stored sessions that used capitalized fields', async () => {
    setNavigatorOnline(false);
    const legacy = {
      user: { ID: 'legacy-1', Email: 'old@test.com', Role: 'ADMIN' },
      tokens: { accessToken: 'legacy-access', refreshToken: 'legacy-refresh' }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.id).toBe('legacy-1'));
    expect(result.current.user).toMatchObject({
      id: 'legacy-1',
      email: 'old@test.com',
      role: 'admin'
    });
  });

  it('logs in, refreshes tokens, and retries authenticated calls on 401', async () => {
    const user = { id: 'user-1', email: 'athlete@test.com', role: 'user' };
    setNavigatorOnline(false);
    api.login.mockResolvedValue({
      user,
      tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' }
    });
    api.refresh
      .mockResolvedValueOnce({ user, tokens: { accessToken: 'access-1', refreshToken: 'refresh-0' } })
      .mockResolvedValue({ user, tokens: { accessToken: 'access-1', refreshToken: 'refresh-0' } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('athlete@test.com', 'StrongPass1!');
    });

    await waitFor(() => expect(result.current.tokens?.accessToken).toBe('access-0'));

    await act(async () => {
      setNavigatorOnline(true);
    });

    const protectedCall = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }))
      .mockResolvedValueOnce('ok');

    await act(async () => {
      await expect(result.current.callWithAuth(protectedCall, 'arg')).resolves.toBe('ok');
    });

    expect(protectedCall).toHaveBeenCalledTimes(2);
    expect(protectedCall).toHaveBeenNthCalledWith(1, 'access-0', 'arg');
    expect(protectedCall).toHaveBeenNthCalledWith(2, 'access-1', 'arg');
    expect(api.refresh.mock.calls.length).toBeGreaterThanOrEqual(1);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored.tokens.accessToken).toBe('access-1');
  });

  it('updates the user profile when refresh returns new role data', async () => {
    setNavigatorOnline(false);
    api.login.mockResolvedValue({
      user: { id: 'user-1', email: 'athlete@test.com', role: 'user' },
      tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' }
    });
    api.refresh.mockResolvedValue({
      user: { id: 'user-1', email: 'athlete@test.com', role: 'admin' },
      tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('athlete@test.com', 'StrongPass1!');
    });

    expect(result.current.user?.role).toBe('user');

    await act(async () => {
      setNavigatorOnline(true);
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.user?.role).toBe('admin'));
    expect(result.current.tokens?.accessToken).toBe('access-1');
  });

  it('logs out and clears persisted session', async () => {
    const user = { id: 'user-1', email: 'athlete@test.com', role: 'user' };
    api.login.mockResolvedValue({
      user,
      tokens: { accessToken: 'access-0', refreshToken: 'refresh-0' }
    });
    api.refresh
      .mockResolvedValueOnce({
        user,
        tokens: { accessToken: 'access-1', refreshToken: 'refresh-0' }
      })
      .mockResolvedValue({
        user,
        tokens: { accessToken: 'access-1', refreshToken: 'refresh-0' }
      });
    api.logout.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('athlete@test.com', 'StrongPass1!');
    });

    await waitFor(() => expect(result.current.tokens?.accessToken).toBe('access-0'));

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(api.logout).toHaveBeenCalledWith('refresh-0');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
