import { useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { getPendingWorkouts, deletePendingWorkout } from './useIndexedDB';

export function useOfflineSync(token) {
  const sync = useCallback(async () => {
    if (!token || !navigator.onLine) {
      return;
    }
    const pending = await getPendingWorkouts();
    for (const workout of pending) {
      try {
        await api.createWorkout(token, workout.payload);
        await deletePendingWorkout(workout.id);
      } catch (error) {
        if (error.status === 401) {
          throw error;
        }
        // keep for next attempt
      }
    }
  }, [token]);

  useEffect(() => {
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);
}
