import React, { useEffect, useState } from 'react';
import AppScaffold from '../components/layout/AppScaffold';
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
    <AppScaffold
      overline="Admin"
      title="Exercise library"
      subtitle="Create, edit and maintain the movements available to every athlete."
    >
      <div className="space-y-6">
        {message && (
          <div className="rounded-[20px] bg-secondaryContainer/40 px-4 py-3 text-sm font-medium text-onSecondaryContainer">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] bg-surfaceContainerHigh/80 p-6 shadow-[0_20px_60px_rgba(12,9,16,0.4)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-onSurface">{editingId ? 'Edit exercise' : 'Create exercise'}</h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-outline/40 px-4 py-2 text-xs font-semibold text-onSurface transition hover:border-primary hover:text-primary"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70">Name</label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                className="w-full rounded-2xl bg-surfaceContainerHighest/60 px-4 py-3 text-sm text-onSurface placeholder:text-onSurfaceVariant/70 focus:outline-none"
                placeholder="Seated cable row"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70">Description</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-2xl bg-surfaceContainerHighest/60 px-4 py-3 text-sm text-onSurface placeholder:text-onSurfaceVariant/70 focus:outline-none"
                placeholder="Targets lats and mid-back. Keep core braced and chest lifted."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70">Muscle group</label>
                <input
                  value={form.muscleGroup}
                  onChange={(event) => setForm({ ...form, muscleGroup: event.target.value })}
                  className="w-full rounded-2xl bg-surfaceContainerHighest/60 px-4 py-3 text-sm text-onSurface placeholder:text-onSurfaceVariant/70 focus:outline-none"
                  placeholder="Back"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-onSurfaceVariant/70">Equipment</label>
                <input
                  value={form.equipment}
                  onChange={(event) => setForm({ ...form, equipment: event.target.value })}
                  className="w-full rounded-2xl bg-surfaceContainerHighest/60 px-4 py-3 text-sm text-onSurface placeholder:text-onSurfaceVariant/70 focus:outline-none"
                  placeholder="Cable machine"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-onPrimary shadow-md shadow-primary/30 transition hover:bg-primary/90"
            >
              {editingId ? 'Update exercise' : 'Create exercise'}
            </button>
          </form>

          <div className="space-y-4">
            {exercises.map((exercise) => (
              <article key={exercise.id} className="rounded-[26px] bg-surfaceContainer/80 p-6 shadow-[0_18px_50px_rgba(11,8,16,0.4)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-onSurface">{exercise.name}</h3>
                    <p className="mt-2 text-sm text-onSurfaceVariant">{exercise.description || 'No description yet.'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-onSurfaceVariant/80">
                      {exercise.muscleGroup && <span className="rounded-full bg-surfaceContainerHighest/70 px-3 py-1">{exercise.muscleGroup}</span>}
                      {exercise.equipment && <span className="rounded-full bg-surfaceContainerHighest/70 px-3 py-1">{exercise.equipment}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(exercise)}
                      className="rounded-full border border-outline/40 px-4 py-2 text-xs font-semibold text-onSurface transition hover:border-primary hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(exercise.id)}
                      className="rounded-full border border-outline/40 px-4 py-2 text-xs font-semibold text-error transition hover:border-error hover:text-onError"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {exercises.length === 0 ? (
              <p className="rounded-[24px] bg-surfaceContainerLow/70 px-4 py-8 text-sm text-onSurfaceVariant">
                No exercises yet. Create the first one using the form.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </AppScaffold>
  );
}
