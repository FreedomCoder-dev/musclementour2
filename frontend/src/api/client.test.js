import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { api, fetchPublicExercises, API_URL } from './client';

const originalFetch = global.fetch;

describe('api client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('sends credentials when logging in and returns parsed data', async () => {
    const payload = { user: { id: '1', email: 'user@test.com' }, tokens: { accessToken: 'a', refreshToken: 'r' } };
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload)
    });

    const result = await api.login('user@test.com', 'secret');

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/api/v1/auth/login`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@test.com', password: 'secret' })
      })
    );
    expect(result).toEqual(payload);
  });

  it('attaches bearer tokens and surfaces request errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
    });

    await expect(api.getProfile('token-123')).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/api/v1/profile`,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123'
        }
      })
    );
  });

  it('returns null for 204 responses', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn()
    });

    const result = await api.adminDeleteExercise('token-abc', 'exercise-1');

    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/api/v1/exercises/exercise-1`,
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('fetches public exercises and returns data when successful', async () => {
    const exercises = [{ id: '1', name: 'Squat' }];
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(exercises)
    });

    await expect(fetchPublicExercises()).resolves.toEqual(exercises);
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/v1/exercises`);
  });

  it('throws when public exercise fetch fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({})
    });

    await expect(fetchPublicExercises()).rejects.toThrow('Failed to load exercises');
  });
});
