import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function MainPage() {
  const navigate = useNavigate();
  const { user, isOnline } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm text-primary">
              v{__APP_VERSION__} · Intelligent workout guidance
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Welcome back, <span className="text-secondary">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-lg text-white/70">
              Log every set, monitor your progress and stay on track even without connectivity. Muscle Mentour keeps your
              data safe offline and syncs automatically when you are back online.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/workout/select')}
                className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:translate-y-1 hover:bg-primary/90"
              >
                Start a workout
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-secondary hover:text-secondary"
              >
                View profile
              </button>
            </div>
          </div>
          <div className="relative rounded-3xl border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 shadow-2xl">
            <div className="grid gap-4">
              <div className="rounded-2xl bg-slate-900/80 p-5">
                <p className="text-sm uppercase tracking-widest text-white/40">Session status</p>
                <p className="mt-2 text-2xl font-semibold">{isOnline ? 'Cloud synced' : 'Offline logging enabled'}</p>
                <p className="mt-3 text-sm text-white/60">
                  Workouts are cached locally and automatically uploaded once your connection stabilizes.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 p-5">
                <p className="text-sm uppercase tracking-widest text-white/40">Roles & permissions</p>
                <p className="mt-2 text-2xl font-semibold capitalize">{user?.role}</p>
                <p className="mt-3 text-sm text-white/60">
                  {user?.role === 'admin' ? 'You can manage the global exercise library from the admin panel.' : 'Your training results remain private to your account.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
