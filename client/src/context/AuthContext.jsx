import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const ROLE_LABELS = {
  raw_material_supplier: 'Raw Material Supplier',
  product_supplier: 'Product Supplier',
  raw_material_customer: 'Raw Material Customer',
  product_customer: 'Product Customer',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tradehub_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tradehub_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('tradehub_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('tradehub_token');
        localStorage.removeItem('tradehub_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('tradehub_token', res.data.token);
    localStorage.setItem('tradehub_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    localStorage.setItem('tradehub_token', res.data.token);
    localStorage.setItem('tradehub_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('tradehub_token');
    localStorage.removeItem('tradehub_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
