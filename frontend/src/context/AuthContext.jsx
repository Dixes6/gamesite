import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUserProfile } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'gamesite_auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Загрузка профиля пользователя по токену
  const fetchProfile = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await getCurrentUserProfile(authToken);
      setUser(profile);
    } catch (err) {
      console.warn('Не удалось загрузить профиль или токен истёк:', err.message);
      // Если токен невалиден — очищаем
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Первичная проверка токена при загрузке приложения
  useEffect(() => {
    fetchProfile(token);
  }, [token, fetchProfile]);

  // Метод входа
  const login = async (username, password) => {
    const data = await loginUser({ username, password });
    const newToken = data.access_token;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    await fetchProfile(newToken);
    return data;
  };

  // Метод регистрации
  const register = async ({ username, password, avatarId, frameId }) => {
    const data = await registerUser({ username, password, avatarId, frameId });
    const newToken = data.access_token;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    await fetchProfile(newToken);
    return data;
  };

  // Метод выхода
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // Ручное обновление данных профиля (например, после покупок или начисления XP)
  const refreshUser = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
