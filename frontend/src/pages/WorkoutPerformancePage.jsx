import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppScaffold from '../components/layout/AppScaffold';
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
      <AppScaffold
        overline="Log session"
        title="Exercise missing"
        subtitle="We could not load that movement. Refresh the library and try again."
        hideNavigation
      >
        <div className="mt-10 rounded-[26px] bg-surfaceContainerHigh/70 px-6 py-8 text-center text-sm text-onSurfaceVariant">
          <p>Exercise not found. Preload the library and try again.</p>
          <button
            type="button"
            onClick={() => navigate('/workout/select')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-onPrimary shadow-md shadow-primary/30 transition hover:bg-primary/90"
          >
            Back to library
          </button>
        </div>
      </AppScaffold>
    );
  }

  return (
    <AppScaffold
      overline="Log session"
      title={exercise.name}
      subtitle={
        exercise.description || 'Log your best set, keep notes for cues and wrap when you are satisfied with the effort.'
      }
      hideNavigation
      action={
        <button
          type="button"
          onClick={() => navigate('/workout/select')}
          className="rounded-full border border-outline/40 px-4 py-2 text-xs font-semibold text-onSurface transition hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-[28px] bg-surfaceContainerHigh/70 p-6 shadow-[0_18px_55px_rgba(12,9,16,0.45)]">
          <h2 className="text-base font-semibold text-onSurface">Set details</h2>
          <p className="mt-1 text-sm text-onSurfaceVariant">Capture the essentials for this lift.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70" htmlFor="sets-input">
                Sets
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-surfaceContainerHighest/70 px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-onSurfaceVariant" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 7h14M5 12h14M5 17h7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  id="sets-input"
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(event) => setSets(event.target.value)}
                  className="w-full bg-transparent text-base font-semibold text-onSurface focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70" htmlFor="reps-input">
                Reps
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-surfaceContainerHighest/70 px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-onSurfaceVariant" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 9h12M6 15h12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  id="reps-input"
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(event) => setReps(event.target.value)}
                  className="w-full bg-transparent text-base font-semibold text-onSurface focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70" htmlFor="weight-input">
                Weight (kg)
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-surfaceContainerHighest/70 px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-onSurfaceVariant" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4.5 9.5h15v5h-15z" />
                  <path d="M8 14.5v-5" />
                  <path d="M16 14.5v-5" />
                </svg>
                <input
                  id="weight-input"
                  type="number"
                  min="0"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  className="w-full bg-transparent text-base font-semibold text-onSurface focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70" htmlFor="duration-input">
                Duration (min)
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-surfaceContainerHighest/70 px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-onSurfaceVariant" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  id="duration-input"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="w-full bg-transparent text-base font-semibold text-onSurface focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-surfaceContainer/80 p-6">
          <h2 className="text-base font-semibold text-onSurface">Notes</h2>
          <p className="mt-1 text-sm text-onSurfaceVariant">Capture cues, tempo or how the set felt.</p>
          <div className="mt-4 rounded-3xl bg-surfaceContainerHighest/60 p-4">
            <textarea
              rows="4"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: RPE 8, slow eccentric, pause at bottom"
              className="h-32 w-full resize-none bg-transparent text-sm text-onSurface focus:outline-none placeholder:text-onSurfaceVariant/70"
            />
          </div>
        </section>

        {message ? (
          <div className="rounded-[24px] bg-secondaryContainer/50 px-4 py-3 text-sm font-medium text-onSecondaryContainer">
            {message}
          </div>
        ) : null}

        <div className="sticky bottom-6 z-20 space-y-3">
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="w-full rounded-full bg-primary px-5 py-4 text-base font-semibold text-onPrimary shadow-lg shadow-primary/35 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
          >
            {submitting ? 'Saving set…' : 'Finish workout'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/workout/select')}
            className="w-full rounded-full border border-outline/40 px-5 py-4 text-base font-semibold text-onSurface transition hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </AppScaffold>
  );
}
