import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Choose your exercises</h1>
            <p className="mt-2 text-sm text-white/60">
              Browse the library curated by your coaches. Tap preload before going offline to take everything with you.
            </p>
          </div>
          <button
            onClick={preload}
            className="rounded-2xl border border-secondary/50 px-6 py-3 text-sm font-semibold text-secondary transition hover:border-secondary"
          >
            Preload for offline
          </button>
        </div>
        <div className="mt-6">
          <input
            type="search"
            placeholder="Search by name, muscle group or equipment"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-primary focus:outline-none"
          />
        </div>
        {message && <p className="mt-4 text-sm text-secondary">{message}</p>}
        {loading ? (
          <p className="mt-10 text-center text-sm text-white/60">Loading exercises...</p>
        ) : filteredExercises.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/60">No exercises found. Try adjusting your search.</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {filteredExercises.map((exercise) => (
              <article key={exercise.id} className="rounded-3xl border border-white/5 bg-white/5 p-6 transition hover:border-primary/60">
                <h2 className="text-xl font-semibold">{exercise.name}</h2>
                <p className="mt-2 text-sm text-white/70">{exercise.description || 'No description provided yet.'}</p>
                <dl className="mt-4 flex flex-wrap gap-3 text-xs text-white/50">
                  {exercise.muscleGroup && (
                    <div className="rounded-full bg-white/10 px-3 py-1">
                      <dt className="sr-only">Muscle</dt>
                      <dd>{exercise.muscleGroup}</dd>
                    </div>
                  )}
                  {exercise.equipment && (
                    <div className="rounded-full bg-white/10 px-3 py-1">
                      <dt className="sr-only">Equipment</dt>
                      <dd>{exercise.equipment}</dd>
                    </div>
                  )}
                </dl>
                <button
                  onClick={() => navigate(`/workout/${exercise.id}`)}
                  className="mt-6 w-full rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Log this exercise
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
