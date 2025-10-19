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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-white/70">
          Join Muscle Mentour to elevate every training session.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-white" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          <button
            type="submit"
            disabled={loading || !isOnline}
            className="flex w-full items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:bg-white/20"
          >
            {loading ? 'Creating account...' : 'Get started'}
          </button>
        </form>
        <p className="mt-6 text-sm text-white/70">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-secondary hover:text-secondary/80">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
