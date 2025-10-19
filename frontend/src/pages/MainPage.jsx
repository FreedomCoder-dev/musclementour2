import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppScaffold from '../components/layout/AppScaffold';
import { useAuth } from '../context/AuthContext';

const quickTips = [
  {
    title: 'Prime your focus',
    description: 'Keep your warm-up under five minutes and note the first working weight to stay dialled in.'
  },
  {
    title: 'Log smarter',
    description: 'Add notes for tempo or RPE after each set to unlock better insights later on.'
  }
];

export default function MainPage() {
  const navigate = useNavigate();
  const { user, isOnline } = useAuth();
  const displayName = user?.email?.split('@')[0] || 'athlete';

  return (
    <AppScaffold
      overline="Current workout"
      title="Current workout"
      subtitle="Dial in the next session, track each set and keep everything synced across devices."
      action={
        user?.role === 'admin' ? (
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="rounded-full bg-secondaryContainer px-4 py-2 text-xs font-semibold text-onSecondaryContainer shadow-sm shadow-secondary/20 transition hover:bg-secondaryContainer/90"
          >
            Admin tools
          </button>
        ) : null
      }
    >
      <section className="space-y-6">
        <article className="rounded-[28px] bg-surfaceContainerHigh/80 p-6 shadow-[0_30px_70px_rgba(13,9,18,0.35)]">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate('/workout/select')}
              className="grid h-16 w-16 place-items-center rounded-full bg-primary text-onPrimary shadow-lg shadow-primary/35 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="currentColor"
              >
                <path d="M8 5.5v13l10-6.5-10-6.5Z" />
              </svg>
            </button>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-onSurfaceVariant/80">Hello, {displayName}</p>
              <h2 className="mt-2 text-2xl font-semibold text-onSurface">Ready when you are</h2>
              <p className="mt-2 text-sm leading-relaxed text-onSurfaceVariant">
                Start a brand-new workout or load one of your saved templates. Everything is cached locally so you can train even without signal.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surfaceContainer/90 px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-onSurfaceVariant/80">App version</p>
              <p className="mt-1 text-sm font-semibold text-onSurface">v{__APP_VERSION__}</p>
            </div>
            <div className="rounded-2xl bg-surfaceContainer/90 px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-onSurfaceVariant/80">Connection</p>
              <p className="mt-1 text-sm font-semibold text-onSurface">{isOnline ? 'Cloud synced' : 'Offline ready'}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/workout/select')}
              className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-onPrimary shadow-md shadow-primary/25 transition hover:bg-primary/90"
            >
              Start new workout
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="rounded-full border border-outline/40 px-5 py-3 text-sm font-semibold text-onSurface transition hover:border-primary hover:text-primary"
            >
              View profile
            </button>
          </div>
        </article>

        <article className="rounded-[28px] bg-surfaceContainer/80 p-6 shadow-[0_20px_50px_rgba(8,6,14,0.45)]">
          <h3 className="text-lg font-semibold text-onSurface">Shortcuts</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/workout/select')}
              className="flex items-center justify-between rounded-2xl bg-surfaceContainerHighest/60 px-4 py-4 text-left transition hover:bg-surfaceContainerHighest/90"
            >
              <div>
                <p className="text-sm font-medium text-onSurface">Browse exercise library</p>
                <p className="mt-1 text-xs text-onSurfaceVariant">Templates, favourites and custom moves</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-primary">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center justify-between rounded-2xl bg-surfaceContainerHighest/60 px-4 py-4 text-left transition hover:bg-surfaceContainerHighest/90"
            >
              <div>
                <p className="text-sm font-medium text-onSurface">Review past sessions</p>
                <p className="mt-1 text-xs text-onSurfaceVariant">Check logs, notes and sync status</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondaryContainer/50 text-onSecondaryContainer">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 12h12M12 6v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </div>
        </article>

        <article className="rounded-[28px] bg-surfaceContainerLow/70 p-6">
          <h3 className="text-lg font-semibold text-onSurface">Coach notes</h3>
          <div className="mt-4 space-y-4">
            {quickTips.map((tip) => (
              <div key={tip.title} className="rounded-2xl bg-surfaceContainerHighest/40 px-4 py-4">
                <p className="text-sm font-semibold text-onSurface">{tip.title}</p>
                <p className="mt-1 text-sm text-onSurfaceVariant">{tip.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppScaffold>
  );
}
