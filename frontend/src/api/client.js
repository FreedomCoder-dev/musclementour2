const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost').replace(/\/$/, '');
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;

async function request(path, { method = 'GET', body, token, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  if (response.status === 204) {
    return null;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  login: (email, password) => request('/api/v1/auth/login', { method: 'POST', body: { email, password } }),
  register: (email, password) => request('/api/v1/auth/register', { method: 'POST', body: { email, password } }),
  refresh: (refreshToken) => request('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken } }),
  logout: (refreshToken) => request('/api/v1/auth/logout', { method: 'POST', body: { refreshToken } }),
  getProfile: (token) => request('/api/v1/profile', { token }),
  listExercises: (token) => request('/api/v1/exercises', { token }),
  adminCreateExercise: (token, payload) => request('/api/v1/exercises', { method: 'POST', body: payload, token }),
  adminUpdateExercise: (token, id, payload) => request(`/api/v1/exercises/${id}`, { method: 'PUT', body: payload, token }),
  adminDeleteExercise: (token, id) => request(`/api/v1/exercises/${id}`, { method: 'DELETE', token }),
  listWorkouts: (token) => request('/api/v1/workouts', { token }),
  createWorkout: (token, payload) => request('/api/v1/workouts', { method: 'POST', body: payload, token })
};

export async function fetchPublicExercises() {
  const response = await fetch(`${API_URL}/api/v1/exercises`);
  if (!response.ok) {
    throw new Error('Failed to load exercises');
  }
  return response.json();
}

export { API_URL };
