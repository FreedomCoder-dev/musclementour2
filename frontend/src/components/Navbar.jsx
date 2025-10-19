import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { logout, user, isOnline } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-white/5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-white">
          Muscle <span className="text-primary">Mentour</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isOnline ? 'bg-secondary/20 text-secondary' : 'bg-amber-500/20 text-amber-200'}`}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-secondary' : 'bg-amber-400'}`} />
            {isOnline ? 'Online' : 'Offline mode'}
          </span>
          {user?.role === 'admin' ? (
            <Link
              to="/admin"
              className="inline-flex rounded-full border border-primary/60 px-4 py-2 text-primary transition hover:border-primary hover:bg-primary/20"
            >
              Admin Panel
            </Link>
          ) : null}
          <Link to="/profile" className="rounded-full bg-primary/20 px-4 py-2 text-primary transition hover:bg-primary/30">
            {user?.email || 'Profile'}
          </Link>
          <button
            onClick={logout}
            className="rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-primary hover:text-primary"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
