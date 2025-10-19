import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { createAuthSessionManager } from '../modules/auth/sessionManager';

function normalizeUser(rawUser) {
  if (!rawUser) return null;
  const role = rawUser.role ?? (typeof rawUser.Role === 'string' ? rawUser.Role.toLowerCase() : rawUser.Role);
  return {
    id: rawUser.id ?? rawUser.ID ?? rawUser.uid ?? null,
    email: rawUser.email ?? rawUser.Email ?? null,
    role: role ?? null,
    createdAt: rawUser.createdAt ?? rawUser.CreatedAt ?? null
  };
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const onlineRef = useRef(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [isOnline, setIsOnline] = useState(onlineRef.current);

  const managerRef = useRef(null);
  if (!managerRef.current) {
    managerRef.current = createAuthSessionManager({
      api,
      storage: typeof window !== 'undefined' ? window.localStorage : null,
      isOnline: () => onlineRef.current
    });
  }
  const manager = managerRef.current;

  const [state, setState] = useState(manager.getState());

  useEffect(() => {
    const unsubscribe = manager.subscribe((nextState) => {
      setState({
        ...nextState,
        user: normalizeUser(nextState.user)
      });
    });
    manager.initialize();
    return unsubscribe;
  }, [manager]);

  useEffect(() => {
    const handleOnline = () => {
      onlineRef.current = true;
      setIsOnline(true);
    };
    const handleOffline = () => {
      onlineRef.current = false;
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const contextValue = useMemo(() => ({
    user: normalizeUser(state.user),
    tokens: state.tokens,
    isAuthenticated: Boolean(state.user && state.tokens?.accessToken),
    login: async (email, password) => {
      const user = await manager.login(email, password);
      return normalizeUser(user);
    },
    register: async (email, password) => {
      const user = await manager.register(email, password);
      return normalizeUser(user);
    },
    logout: () => manager.logout(),
    refresh: () => manager.refresh(),
    callWithAuth: (fn, ...args) => manager.callWithAuth(fn, ...args),
    loading: state.loading,
    isOnline,
    lastError: state.lastError
  }), [manager, state, isOnline]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
