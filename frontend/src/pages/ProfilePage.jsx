import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppScaffold from '../components/layout/AppScaffold';
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
    <AppScaffold
      overline="Profile"
      title="Your profile"
      subtitle="Keep track of synced data, manage roles and revisit your latest sessions."
    >
      <div className="space-y-8">
        <section className="rounded-[28px] bg-surfaceContainerHigh/80 p-6 shadow-[0_20px_60px_rgba(12,9,16,0.35)]">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70">Email</p>
              <p className="mt-2 text-base font-semibold text-onSurface">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70">Role</p>
              <p className="mt-2 text-base font-semibold text-onSurface capitalize">{user?.role}</p>
            </div>
          </div>
          {user?.role === 'admin' ? (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondaryContainer px-5 py-3 text-sm font-semibold text-onSecondaryContainer shadow-sm transition hover:bg-secondaryContainer/90"
            >
              Manage exercise library
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-onSurface">Recent workouts</h2>
          {loading ? (
            <p className="mt-4 text-sm text-onSurfaceVariant">Loading history…</p>
          ) : workouts.length === 0 ? (
            <div className="mt-4 rounded-[24px] bg-surfaceContainerLow/70 px-4 py-10 text-center text-sm text-onSurfaceVariant">
              No workouts logged yet. Start your next session to build your timeline.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {workouts.map((workout) => (
                <article key={workout.id} className="rounded-[24px] bg-surfaceContainer/80 p-5 shadow-[0_16px_40px_rgba(10,7,15,0.4)]">
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70">Completed</p>
                      <p className="mt-1 text-base font-semibold text-onSurface">
                        {new Date(workout.completedAt || workout.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                      {workout.entries?.length || 0} exercises
                    </span>
                  </header>
                  <ul className="mt-4 space-y-2 text-sm text-onSurfaceVariant">
                    {workout.entries?.map((entry) => (
                      <li key={entry.id} className="rounded-2xl bg-surfaceContainerHighest/60 px-4 py-3">
                        <div className="text-sm font-semibold text-onSurface">{entry.exerciseId}</div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs uppercase tracking-wide text-onSurfaceVariant/80">
                          <span>{entry.sets} sets</span>
                          <span>{entry.reps} reps</span>
                          {entry.weight ? <span>{entry.weight} kg</span> : null}
                          {entry.durationSeconds ? <span>{Math.round(entry.durationSeconds / 60)} min</span> : null}
                        </div>
                        {entry.notes ? (
                          <p className="mt-2 text-xs text-onSurfaceVariant/80">{entry.notes}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppScaffold>
  );
}
