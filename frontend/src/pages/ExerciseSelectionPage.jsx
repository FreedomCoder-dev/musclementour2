import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppScaffold from '../components/layout/AppScaffold';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getExercises, saveExercises } from '../hooks/useIndexedDB';

export default function ExerciseSelectionPage() {
  const { callWithAuth, isOnline } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    const loadLocal = async () => {
      const cached = await getExercises();
      if (!ignore && cached.length) {
        setExercises(cached);
        setLoading(false);
      }
    };
    loadLocal();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setLoading(false);
      return;
    }
    let ignore = false;
    const fetchExercises = async () => {
      try {
        const data = await callWithAuth(api.listExercises);
        if (!ignore) {
          setExercises(data);
          await saveExercises(data);
        }
      } catch (error) {
        console.warn('Failed to fetch exercises', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchExercises();
    return () => {
      ignore = true;
    };
  }, [callWithAuth, isOnline]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) =>
      [exercise.name, exercise.muscleGroup, exercise.equipment]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()))
    );
  }, [exercises, search]);

  const preload = async () => {
    if (!isOnline) {
      setMessage('You are offline. Connect to preload the latest library.');
      return;
    }
    setMessage('');
    try {
      const data = await callWithAuth(api.listExercises);
      setExercises(data);
      await saveExercises(data);
      setMessage(`Loaded ${data.length} exercises for offline use.`);
    } catch (error) {
      setMessage(error.message || 'Failed to preload exercises.');
    }
  };

  return (
    <AppScaffold
      overline="New workout"
      title="Assemble workout"
      subtitle="Search your library, preload for offline access and jump straight into logging."
    >
      <div className="space-y-6">
        <section className="rounded-[26px] bg-surfaceContainerHigh/80 p-5 shadow-[0_18px_60px_rgba(11,8,16,0.35)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-onSurface">Find the right moves</p>
              <p className="mt-1 text-sm text-onSurfaceVariant">
                Browse everything curated by your coaches. Preload before you go offline.
              </p>
            </div>
            <button
              type="button"
              onClick={preload}
              className="inline-flex items-center gap-2 rounded-full bg-secondaryContainer px-5 py-3 text-sm font-semibold text-onSecondaryContainer shadow-sm transition hover:bg-secondaryContainer/90"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 18h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Preload offline
            </button>
          </div>
          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70" htmlFor="exercise-search">
            Search library
          </label>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surfaceContainerHighest/60 px-4 py-3">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-onSurfaceVariant" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-2.8-2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              id="exercise-search"
              type="search"
              placeholder="Name, muscle group or equipment"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-onSurface placeholder:text-onSurfaceVariant/70 focus:outline-none"
            />
          </div>
          {message && <p className="mt-4 text-xs font-medium text-secondary">{message}</p>}
        </section>

        <section className="space-y-4">
          {loading ? (
            <p className="text-center text-sm text-onSurfaceVariant">Loading exercises...</p>
          ) : filteredExercises.length === 0 ? (
            <div className="rounded-[24px] bg-surfaceContainerLow/70 px-4 py-10 text-center text-sm text-onSurfaceVariant">
              Nothing here yet. Try adjusting your search or preload when you are back online.
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <article key={exercise.id} className="rounded-[24px] bg-surfaceContainer/80 p-5 shadow-[0_14px_40px_rgba(8,6,14,0.35)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-onSurface">{exercise.name}</h2>
                    <p className="mt-2 text-sm text-onSurfaceVariant">
                      {exercise.description || 'No description provided yet. Add one from the admin panel.'}
                    </p>
                    <dl className="mt-4 flex flex-wrap gap-2 text-xs text-onSurfaceVariant/90">
                      {exercise.muscleGroup && (
                        <div className="rounded-full bg-surfaceContainerHighest/80 px-3 py-1">
                          <dt className="sr-only">Muscle</dt>
                          <dd>{exercise.muscleGroup}</dd>
                        </div>
                      )}
                      {exercise.equipment && (
                        <div className="rounded-full bg-surfaceContainerHighest/80 px-3 py-1">
                          <dt className="sr-only">Equipment</dt>
                          <dd>{exercise.equipment}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/workout/${exercise.id}`)}
                    className="inline-flex items-center gap-2 self-end rounded-full bg-primary px-5 py-3 text-sm font-semibold text-onPrimary shadow-md shadow-primary/30 transition hover:bg-primary/90"
                  >
                    Log exercise
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AppScaffold>
  );
}
