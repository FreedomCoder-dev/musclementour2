import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { addPendingWorkout, getExercises } from '../hooks/useIndexedDB';

export default function WorkoutPerformancePage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { callWithAuth, isOnline } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState(10);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadExercise = async () => {
      const library = await getExercises();
      const found = library.find((item) => item.id === exerciseId);
      setExercise(found || null);
    };
    loadExercise();
  }, [exerciseId]);

  const handleFinish = async () => {
    if (!exerciseId) {
      return;
    }
    setSubmitting(true);
    setMessage('');
    const now = new Date();
    const payload = {
      startedAt: new Date(now.getTime() - duration * 60 * 1000),
      completedAt: now,
      entries: [
        {
          exerciseId,
          sets: Number(sets),
          reps: Number(reps),
          weight: weight ? Number(weight) : 0,
          durationSeconds: Number(duration) * 60,
          notes
        }
      ]
    };

    if (!isOnline) {
      const offlineId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      await addPendingWorkout({ id: offlineId, payload });
      setMessage('Workout saved offline. It will sync automatically.');
      setSubmitting(false);
      setTimeout(() => navigate('/workout/select'), 1000);
      return;
    }

    try {
      await callWithAuth(api.createWorkout, payload);
      setMessage('Workout saved successfully.');
      setTimeout(() => navigate('/workout/select'), 800);
    } catch (error) {
      setMessage(error.message || 'Failed to log workout. Saved for retry.');
      const offlineId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      await addPendingWorkout({ id: offlineId, payload });
    } finally {
      setSubmitting(false);
    }
  };

  if (!exercise) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-white/60">Exercise not found. Preload the library and try again.</p>
          <button
            onClick={() => navigate('/workout/select')}
            className="mt-6 rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-secondary hover:text-secondary"
          >
            Back to library
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h1 className="text-3xl font-semibold">{exercise.name}</h1>
          <p className="mt-2 text-sm text-white/60">{exercise.description || 'Focus on controlled tempo and full range of motion.'}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-white">Sets</label>
              <input
                type="number"
                min="1"
                value={sets}
                onChange={(event) => setSets(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Reps</label>
              <input
                type="number"
                min="1"
                value={reps}
                onChange={(event) => setReps(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Weight (kg)</label>
              <input
                type="number"
                min="0"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="text-sm font-medium text-white">Notes</label>
            <textarea
              rows="3"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
              placeholder="How did the set feel? Record RPE, tempo or coaching cues."
            />
          </div>
          {message && <p className="mt-4 text-sm text-secondary">{message}</p>}
          <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-end">
            <button
              onClick={() => navigate('/workout/select')}
              className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-secondary hover:text-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {submitting ? 'Saving...' : 'Finish workout'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
