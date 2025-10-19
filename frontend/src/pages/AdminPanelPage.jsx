import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const emptyExercise = {
  name: '',
  description: '',
  muscleGroup: '',
  equipment: ''
};

export default function AdminPanelPage() {
  const { callWithAuth } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState(emptyExercise);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const loadExercises = async () => {
    try {
      const data = await callWithAuth(api.listExercises);
      setExercises(data);
    } catch (error) {
      setMessage(error.message || 'Failed to load exercises');
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const resetForm = () => {
    setForm(emptyExercise);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await callWithAuth(api.adminUpdateExercise, editingId, form);
        setMessage('Exercise updated');
      } else {
        await callWithAuth(api.adminCreateExercise, form);
        setMessage('Exercise created');
      }
      resetForm();
      await loadExercises();
    } catch (error) {
      setMessage(error.message || 'Failed to save exercise');
    }
  };

  const handleEdit = (exercise) => {
    setForm({
      name: exercise.name,
      description: exercise.description || '',
      muscleGroup: exercise.muscleGroup || '',
      equipment: exercise.equipment || ''
    });
    setEditingId(exercise.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exercise?')) {
      return;
    }
    try {
      await callWithAuth(api.adminDeleteExercise, id);
      setMessage('Exercise removed');
      await loadExercises();
    } catch (error) {
      setMessage(error.message || 'Failed to remove exercise');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Admin panel</h1>
            <p className="mt-2 text-sm text-white/60">Manage the global exercise library used by every athlete.</p>
          </div>
        </div>
        {message && <p className="mt-4 text-sm text-secondary">{message}</p>}

        <section className="mt-8 grid gap-8 lg:grid-cols-[2fr,3fr]">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">{editingId ? 'Edit exercise' : 'New exercise'}</h2>
            <div>
              <label className="text-sm font-medium text-white">Name</label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Description</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-white">Muscle group</label>
                <input
                  value={form.muscleGroup}
                  onChange={(event) => setForm({ ...form, muscleGroup: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white">Equipment</label>
                <input
                  value={form.equipment}
                  onChange={(event) => setForm({ ...form, equipment: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-secondary hover:text-secondary"
                >
                  Cancel edit
                </button>
              )}
              <button
                type="submit"
                className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                {editingId ? 'Update exercise' : 'Create exercise'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {exercises.map((exercise) => (
              <article key={exercise.id} className="rounded-3xl border border-white/5 bg-white/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{exercise.name}</h3>
                    <p className="text-sm text-white/60">{exercise.description || 'No description yet.'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
                      {exercise.muscleGroup && <span className="rounded-full bg-white/10 px-3 py-1">{exercise.muscleGroup}</span>}
                      {exercise.equipment && <span className="rounded-full bg-white/10 px-3 py-1">{exercise.equipment}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-secondary hover:text-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exercise.id)}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {exercises.length === 0 && (
              <p className="text-sm text-white/60">No exercises yet. Create the first one using the form on the left.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
