import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useOfflineSync } from './hooks/useOfflineSync';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';
import ProfilePage from './pages/ProfilePage';
import ExerciseSelectionPage from './pages/ExerciseSelectionPage';
import WorkoutPerformancePage from './pages/WorkoutPerformancePage';
import AdminPanelPage from './pages/AdminPanelPage';

export default function App() {
  const { tokens, isOnline, user } = useAuth();
  useOfflineSync(tokens?.accessToken);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {!isOnline && (
        <div className="bg-amber-500/20 text-amber-200">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm">
            <span>Offline mode enabled. New workout logs are stored locally and sync once you are online again.</span>
          </div>
        </div>
      )}
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route index element={<MainPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/workout/select" element={<ExerciseSelectionPage />} />
          <Route path="/workout/:exerciseId" element={<WorkoutPerformancePage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminPanelPage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={user ? '/' : '/login'} replace />}
        />
      </Routes>
    </div>
  );
}
