import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthSessionManager } from './sessionManager';

function createStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: vi.fn((key) => (key in data ? data[key] : null)),
    setItem: vi.fn((key, value) => {
      data[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete data[key];
    })
  };
}

describe('AuthSessionManager', () => {
  let api;
  let storage;
  let scheduler;

  beforeEach(() => {
    api = {
      login: vi.fn(),
      register: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn()
    };
    storage = createStorage();
    scheduler = vi.fn((fn, timeout) => {
      setImmediate(fn);
      return timeout;
    });
  });

  it('hydrates stored session on initialize', async () => {
    const payload = JSON.stringify({
      user: { id: 'user-1', email: 'test@example.com' },
      tokens: { accessToken: 'a', refreshToken: 'r' },
      savedAt: 1
    });
    storage = createStorage({ 'mm-auth': payload });
    const manager = new AuthSessionManager({ api, storage, scheduler });

    await manager.initialize({ attemptRefresh: false });

    const state = manager.getState();
    expect(state.user).toEqual({ id: 'user-1', email: 'test@example.com' });
    expect(state.tokens).toEqual({ accessToken: 'a', refreshToken: 'r' });
    expect(state.loading).toBe(false);
  });

  it('performs refresh with exponential retries for retryable errors', async () => {
    const error = new Error('server error');
    error.status = 500;
    api.refresh
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ user: { id: 'u' }, tokens: { accessToken: 'next', refreshToken: 'ref' } });

    const manager = new AuthSessionManager({
      api,
      storage,
      scheduler,
      baseDelay: 10,
      maxRetries: 3
    });
    manager.persist({ id: 'u' }, { accessToken: 'old', refreshToken: 'ref' });

    const tokens = await manager.refresh();

    expect(api.refresh).toHaveBeenCalledTimes(2);
    expect(tokens).toEqual({ accessToken: 'next', refreshToken: 'ref' });
    expect(scheduler).toHaveBeenCalled();
  });

  it('clears session on non-retryable refresh failure', async () => {
    const error = new Error('unauthorized');
    error.status = 401;
    api.refresh.mockRejectedValue(error);

    const manager = new AuthSessionManager({ api, storage, scheduler });
    manager.persist({ id: 'u' }, { accessToken: 'old', refreshToken: 'ref' });

    await expect(manager.refresh()).rejects.toBe(error);
    expect(manager.getState().tokens).toBeNull();
  });

  it('prevents concurrent refreshes', async () => {
    const deferred = [];
    api.refresh.mockImplementation(() =>
      new Promise((resolve) => {
        deferred.push(resolve);
      })
    );

    const manager = new AuthSessionManager({ api, storage, scheduler });
    manager.persist({ id: 'u' }, { accessToken: 'old', refreshToken: 'ref' });

    const first = manager.refresh();
    const second = manager.refresh();
    expect(api.refresh).toHaveBeenCalledTimes(1);

    deferred[0]({ user: { id: 'u' }, tokens: { accessToken: 'next', refreshToken: 'ref' } });

    await expect(first).resolves.toEqual({ accessToken: 'next', refreshToken: 'ref' });
    await expect(second).resolves.toEqual({ accessToken: 'next', refreshToken: 'ref' });
  });

  it('attempts refresh when callWithAuth receives 401', async () => {
    const manager = new AuthSessionManager({ api, storage, scheduler });
    manager.persist({ id: 'u' }, { accessToken: 'old', refreshToken: 'ref' });

    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('expired'), { status: 401 }))
      .mockResolvedValueOnce('ok');

    api.refresh.mockResolvedValue({
      user: { id: 'u' },
      tokens: { accessToken: 'new', refreshToken: 'ref' }
    });

    const result = await manager.callWithAuth(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(api.refresh).toHaveBeenCalledTimes(1);
  });

  it('clears state and throws when refresh during callWithAuth fails', async () => {
    const manager = new AuthSessionManager({ api, storage, scheduler });
    manager.persist({ id: 'u' }, { accessToken: 'old', refreshToken: 'ref' });

    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('expired'), { status: 401 }));
    const error = Object.assign(new Error('invalid refresh'), { status: 401 });
    api.refresh.mockRejectedValue(error);

    await expect(manager.callWithAuth(fn)).rejects.toBe(error);
    expect(manager.getState().tokens).toBeNull();
  });
});
