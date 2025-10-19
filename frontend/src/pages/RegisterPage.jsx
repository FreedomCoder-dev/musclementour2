import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, isOnline } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-onSurface">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
        <div className="rounded-[30px] bg-surfaceContainerHigh/85 p-8 shadow-[0_30px_70px_rgba(10,7,15,0.55)]">
          <h1 className="text-3xl font-semibold text-onSurface">Create your account</h1>
          <p className="mt-2 text-sm text-onSurfaceVariant">Join Muscle Mentour to elevate every training session.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70" htmlFor="email">
                Email
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-surfaceContainerHighest/70 px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-onSurfaceVariant" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 6 8 6 8-6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-onSurface placeholder:text-onSurfaceVariant/70 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70" htmlFor="password">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-surfaceContainerHighest/70 px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-onSurfaceVariant" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M9 10V7a3 3 0 0 1 6 0v3" />
                </svg>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-onSurface placeholder:text-onSurfaceVariant/70 focus:outline-none"
                />
              </div>
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="submit"
              disabled={loading || !isOnline}
              className="flex w-full items-center justify-center rounded-full bg-secondaryContainer px-5 py-4 text-sm font-semibold text-onSecondaryContainer shadow-md shadow-secondary/30 transition hover:bg-secondaryContainer/90 disabled:cursor-not-allowed disabled:bg-secondaryContainer/50"
            >
              {loading ? 'Creating account…' : 'Get started'}
            </button>
          </form>
          <p className="mt-6 text-sm text-onSurfaceVariant">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-secondary hover:text-secondary/80">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
