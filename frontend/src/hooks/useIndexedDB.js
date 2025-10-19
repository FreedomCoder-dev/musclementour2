import { openDB } from 'idb';

const DB_NAME = 'muscle-mentour';
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('exercises')) {
        db.createObjectStore('exercises', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingWorkouts')) {
        db.createObjectStore('pendingWorkouts', { keyPath: 'id' });
      }
    }
  });
}

export async function saveExercises(exercises) {
  const db = await getDb();
  const tx = db.transaction('exercises', 'readwrite');
  await Promise.all(exercises.map((ex) => tx.store.put(ex)));
  await tx.done;
}

export async function clearExercises() {
  const db = await getDb();
  await db.clear('exercises');
}

export async function getExercises() {
  const db = await getDb();
  return db.getAll('exercises');
}

export async function addPendingWorkout(workout) {
  const db = await getDb();
  await db.put('pendingWorkouts', workout);
}

export async function getPendingWorkouts() {
  const db = await getDb();
  return db.getAll('pendingWorkouts');
}

export async function deletePendingWorkout(id) {
  const db = await getDb();
  await db.delete('pendingWorkouts', id);
}
