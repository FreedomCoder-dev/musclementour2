import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineSync } from './useOfflineSync';
import { api } from '../api/client';
import { getPendingWorkouts, deletePendingWorkout } from './useIndexedDB';

vi.mock('../api/client', () => ({
  api: {
    createWorkout: vi.fn()
  }
}));

vi.mock('./useIndexedDB', () => ({
  getPendingWorkouts: vi.fn(),
  deletePendingWorkout: vi.fn()
}));

const setNavigatorOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value
  });
};

describe('useOfflineSync', () => {
  beforeEach(() => {
    setNavigatorOnline(true);
    vi.clearAllMocks();
  });

  it('skips syncing when offline', async () => {
    setNavigatorOnline(false);

    renderHook(() => useOfflineSync('token-1'));

    await waitFor(() => {
      expect(getPendingWorkouts).not.toHaveBeenCalled();
      expect(api.createWorkout).not.toHaveBeenCalled();
    });
  });

  it('pushes pending workouts when online', async () => {
    const workouts = [
      { id: 'w1', payload: { notes: 'one' } },
      { id: 'w2', payload: { notes: 'two' } }
    ];
    getPendingWorkouts.mockResolvedValue(workouts);
    api.createWorkout.mockResolvedValue({});
    deletePendingWorkout.mockResolvedValue();

    renderHook(() => useOfflineSync('token-sync'));

    await waitFor(() => expect(api.createWorkout).toHaveBeenCalledTimes(2));
    expect(api.createWorkout).toHaveBeenNthCalledWith(1, 'token-sync', workouts[0].payload);
    expect(api.createWorkout).toHaveBeenNthCalledWith(2, 'token-sync', workouts[1].payload);
    expect(deletePendingWorkout).toHaveBeenCalledTimes(2);
    expect(deletePendingWorkout).toHaveBeenNthCalledWith(1, 'w1');
    expect(deletePendingWorkout).toHaveBeenNthCalledWith(2, 'w2');
  });

  it('retains workouts when API errors are non-auth related', async () => {
    const workouts = [
      { id: 'w1', payload: { notes: 'fail' } },
      { id: 'w2', payload: { notes: 'ok' } }
    ];
    getPendingWorkouts.mockResolvedValue(workouts);
    const failure = Object.assign(new Error('Server error'), { status: 500 });
    api.createWorkout
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({});
    deletePendingWorkout.mockResolvedValue();

    renderHook(() => useOfflineSync('token-sync'));

    await waitFor(() => expect(api.createWorkout).toHaveBeenCalledTimes(2));
    expect(deletePendingWorkout).toHaveBeenCalledTimes(1);
    expect(deletePendingWorkout).toHaveBeenCalledWith('w2');
  });
});
