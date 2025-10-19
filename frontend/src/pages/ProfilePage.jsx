import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ProfilePage() {
  const { user, callWithAuth } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const data = await callWithAuth(api.listWorkouts);
        if (!ignore) {
          setWorkouts(data || []);
        }
      } catch (error) {
        console.warn('Failed to load workouts', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [callWithAuth]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h1 className="text-3xl font-semibold">Profile</h1>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-widest text-white/40">Email</p>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-widest text-white/40">Role</p>
              <p className="text-lg font-medium capitalize">{user?.role}</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <div className="mt-8">
              <button
                onClick={() => navigate('/admin')}
                className="rounded-2xl bg-secondary px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-secondary/80"
              >
                Open admin panel
              </button>
            </div>
          )}
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Recent workouts</h2>
          {loading ? (
            <p className="mt-4 text-sm text-white/60">Loading history...</p>
          ) : workouts.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">No workouts logged yet. Start a session to see your history here.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {workouts.map((workout) => (
                <article key={workout.id} className="rounded-2xl border border-white/5 bg-white/5 p-6">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-widest text-white/40">Completed</p>
                      <p className="text-lg font-semibold">
                        {new Date(workout.completedAt || workout.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                      {workout.entries?.length || 0} exercises
                    </span>
                  </header>
                  <ul className="mt-4 space-y-2 text-sm text-white/70">
                    {workout.entries?.map((entry) => (
                      <li key={entry.id} className="rounded-xl bg-slate-900/60 px-4 py-3">
                        <div className="font-semibold">{entry.exerciseId}</div>
                        <div className="flex flex-wrap gap-3 text-xs text-white/50">
                          <span>{entry.sets} sets</span>
                          <span>{entry.reps} reps</span>
                          {entry.weight ? <span>{entry.weight} kg</span> : null}
                          {entry.durationSeconds ? <span>{Math.round(entry.durationSeconds / 60)} min</span> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
