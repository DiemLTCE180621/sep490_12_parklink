import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('parklink_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('parklink_token');
      if (savedToken) {
        try {
          const res = await authService.getCurrentUser();
          if (res?.data?.user) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin người dùng:', error);
          localStorage.removeItem('parklink_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response?.data) {
      const { user: userData, token: jwtToken } = response.data;
      localStorage.setItem('parklink_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return response;
    }
  };

  const registerCustomer = async (data) => {
    const response = await authService.registerCustomer(data);
    return response;
  };

  const registerProvider = async (data) => {
    const response = await authService.registerProvider(data);
    return response;
  };

  const changePassword = async (passwordData) => {
    const response = await authService.changePassword(passwordData);
    if (response?.data?.user) {
      setUser(response.data.user);
    }
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    registerCustomer,
    registerProvider,
    changePassword,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider!');
  }
  return context;
};
