import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchCurrentUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/api/users/me');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn('Session expired or invalid token');
        logout();
      } else {
        console.warn('Could not refresh user profile:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/users/login', { email, password });
    if (res.data.success) {
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      }
      setUser({ email: res.data.email, name: res.data.name });
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const register = async (email, password, name) => {
    const res = await api.post('/api/users/register', { email, password, name });
    if (res.data.success) {
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      }
      setUser({ email: res.data.email, name: res.data.name });
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
