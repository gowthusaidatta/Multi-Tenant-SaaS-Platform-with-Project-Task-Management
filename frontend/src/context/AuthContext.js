import React, { createContext, useState, useCallback, useEffect } from 'react';
import { getCurrentUser, registerTenant, login as loginService, logout as logoutService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is still logged in on mount
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response.data.success) {
        setUser({
          id: response.data.data.id,
          email: response.data.data.email,
          fullName: response.data.data.fullName,
          role: response.data.data.role,
          isActive: response.data.data.isActive,
        });
        setTenant(response.data.data.tenant || null);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    }
  }, [token]);

  const register = useCallback(async (tenantName, subdomain, adminEmail, adminPassword, adminFullName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerTenant({
        tenantName,
        subdomain,
        adminEmail,
        adminPassword,
        adminFullName
      });
      if (response.data.success) {
        return { success: true };
      }
      setError(response.data.message);
      return { success: false, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, tenantSubdomain) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginService({ email, password, tenantSubdomain });
      if (response.data.success) {
        const { user: loggedInUser, tenant: tenantInfo, token: authToken } = response.data.data;
        setUser(loggedInUser);
        setTenant(tenantInfo || null);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('tenantSubdomain', tenantSubdomain);
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutService();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setTenant(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('tenantSubdomain');
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, tenant, token, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
