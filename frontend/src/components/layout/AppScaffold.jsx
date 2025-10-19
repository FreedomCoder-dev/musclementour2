import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  {
    to: '/',
    label: 'Home',
    isActive: (pathname) => pathname === '/',
    icon: (active) => (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? 'text-primary' : 'text-onSurfaceVariant'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 10.75 12 4l8 6.75" />
        <path d="M6.5 9v10.5h5v-5h5v5H19V9" />
      </svg>
    )
  },
  {
    to: '/workout/select',
    label: 'Library',
    isActive: (pathname) => pathname.startsWith('/workout'),
    icon: (active) => (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? 'text-primary' : 'text-onSurfaceVariant'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.75" y="6.5" width="16.5" height="10.5" rx="2.25" />
        <path d="M8 9h8M8 12h8M8 15h4" />
      </svg>
    )
  },
  {
    to: '/profile',
    label: 'Profile',
    isActive: (pathname) => pathname.startsWith('/profile'),
    icon: (active) => (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? 'text-primary' : 'text-onSurfaceVariant'}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="9" r="3.25" />
        <path d="M6.75 18.5c.75-3 3-4.75 5.25-4.75s4.5 1.75 5.25 4.75" />
      </svg>
    )
  }
];

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function WifiIcon({ active }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? 'text-secondary' : 'text-onSurfaceVariant/70'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9c4.5-4 11.5-4 16 0" />
      <path d="M7 12.5c2.5-2.25 7.5-2.25 10 0" />
      <path d="M10 16c1-1 3-1 4 0" />
      <path d="M12 19.5h0" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 14"
      className="h-4 w-7 text-onSurfaceVariant"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="2" width="22" height="10" rx="2" />
      <path d="M25 5.5v3" />
      <rect x="3.2" y="4.2" width="13.6" height="5.6" rx="1.2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export default function AppScaffold({
  overline = 'Muscle Mentour',
  title,
  subtitle,
  action,
  children,
  hideNavigation = false,
  contentClassName = '',
  mainClassName = ''
}) {
  const { isOnline } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const renderedNav = useMemo(() => {
    if (hideNavigation) {
      return null;
    }
    return (
      <footer className="sticky bottom-0 z-30 border-t border-outline/20 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-6 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-3">
          {navItems.map((item) => {
            const active = item.isActive(location.pathname);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium tracking-wide transition ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-onSurfaceVariant hover:bg-surfaceContainerLow hover:text-onSurface'
                }`}
              >
                {item.icon(active)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </footer>
    );
  }, [hideNavigation, location.pathname]);

  return (
    <div className="min-h-screen bg-background text-onSurface">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="border-b border-outline/15 bg-surface/80 pb-4 pt-3 backdrop-blur">
          <div className="px-5">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.35em] text-onSurfaceVariant/80">
              <span>{time}</span>
              <div className="flex items-center gap-3">
                <WifiIcon active={isOnline} />
                <BatteryIcon />
              </div>
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                {overline ? (
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-onSurfaceVariant/80">
                    {overline}
                  </p>
                ) : null}
                {title ? (
                  <h1 className="mt-2 text-3xl font-semibold text-onSurface">
                    {title}
                  </h1>
                ) : null}
                {subtitle ? (
                  <p className="mt-2 text-sm leading-relaxed text-onSurfaceVariant">
                    {subtitle}
                  </p>
                ) : null}
                {!isOnline ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-outline/15 px-4 py-2 text-xs font-medium text-onSurfaceVariant">
                    <span className="h-2 w-2 rounded-full bg-error" aria-hidden="true" />
                    Offline mode — workouts will sync later
                  </div>
                ) : null}
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </div>
        </header>
        <main
          className={`flex-1 overflow-y-auto px-5 pb-28 pt-6 ${contentClassName}`}
          style={{
            paddingBottom: hideNavigation
              ? 'calc(env(safe-area-inset-bottom) + 2.5rem)'
              : 'calc(env(safe-area-inset-bottom) + 6.5rem)'
          }}
        >
          <div className={mainClassName}>{children}</div>
        </main>
        {renderedNav}
      </div>
    </div>
  );
}
