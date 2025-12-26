import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthAPI } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await AuthAPI.me();
      setUser(data.data);
    } catch (e) {
      console.error('Auth refresh failed:', e.message);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (payload) => {
    const { data } = await AuthAPI.login(payload);
    localStorage.setItem('token', data.data.token);
    await refresh();
  };

  const logout = async () => {
    try { await AuthAPI.logout(); } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
