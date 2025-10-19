import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveExercises, getExercises, clearExercises, addPendingWorkout, getPendingWorkouts, deletePendingWorkout } from './useIndexedDB';
import { openDB } from 'idb';

vi.mock('idb', () => {
  const createState = () => ({
    storeNames: new Set(),
    stores: new Map()
  });

  let state = createState();
  let initialized = false;

  const db = {
    objectStoreNames: {
      contains: (name) => state.storeNames.has(name)
    },
    createObjectStore(name) {
      if (!state.storeNames.has(name)) {
        state.storeNames.add(name);
        state.stores.set(name, new Map());
      }
      return {
        put(value) {
          state.stores.get(name).set(value.id, value);
          return Promise.resolve(value.id);
        }
      };
    },
    transaction(name) {
      if (!state.storeNames.has(name)) {
        state.storeNames.add(name);
        state.stores.set(name, new Map());
      }
      const store = state.stores.get(name);
      return {
        store: {
          put(value) {
            store.set(value.id, value);
            return Promise.resolve(value.id);
          },
          clear() {
            store.clear();
            return Promise.resolve();
          }
        },
        done: Promise.resolve()
      };
    },
    clear(name) {
      state.stores.get(name)?.clear();
      return Promise.resolve();
    },
    getAll(name) {
      const values = state.stores.get(name) ? Array.from(state.stores.get(name).values()) : [];
      return Promise.resolve(values);
    },
    put(name, value) {
      if (!state.storeNames.has(name)) {
        state.storeNames.add(name);
        state.stores.set(name, new Map());
      }
      state.stores.get(name).set(value.id, value);
      return Promise.resolve(value.id);
    },
    delete(name, id) {
      state.stores.get(name)?.delete(id);
      return Promise.resolve();
    }
  };

  const openDBMock = vi.fn(async (_name, _version, options) => {
    if (!initialized) {
      options?.upgrade?.(db);
      initialized = true;
    }
    return db;
  });

  openDBMock.__reset = () => {
    state = createState();
    initialized = false;
  };

  return { openDB: openDBMock };
});

describe('useIndexedDB storage helpers', () => {
  beforeEach(() => {
    openDB.__reset?.();
    openDB.mockClear();
  });

  afterEach(() => {
    openDB.__reset?.();
  });

  it('persists and retrieves exercise catalog entries', async () => {
    const exercises = [
      { id: 'ex-1', name: 'Squat' },
      { id: 'ex-2', name: 'Bench' }
    ];

    await saveExercises(exercises);
    const stored = await getExercises();

    expect(stored).toEqual(exercises);
    expect(openDB).toHaveBeenCalled();
  });

  it('clears stored exercises', async () => {
    await saveExercises([{ id: 'ex-1', name: 'Deadlift' }]);
    await clearExercises();

    const stored = await getExercises();
    expect(stored).toEqual([]);
  });

  it('manages pending workout queue entries', async () => {
    const workout = { id: 'workout-1', payload: { notes: 'test' } };
    await addPendingWorkout(workout);

    let pending = await getPendingWorkouts();
    expect(pending).toEqual([workout]);

    await deletePendingWorkout(workout.id);
    pending = await getPendingWorkouts();
    expect(pending).toEqual([]);
  });
});
