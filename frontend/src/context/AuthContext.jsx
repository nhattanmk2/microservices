import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      const decoded = parseJwt(savedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        return {
          username: decoded.sub,
          role: decoded.role || 'USER',
        };
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      if (!decoded || decoded.exp * 1000 <= Date.now()) {
        logout();
      }
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authApi.login({ username, password });
      if (data.accessToken) {
        const decoded = parseJwt(data.accessToken);
        const userInfo = {
          username: decoded?.sub || username,
          role: decoded?.role || 'USER',
        };
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(userInfo));
        setToken(data.accessToken);
        setUser(userInfo);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Đăng nhập không thành công' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Đăng nhập thất bại';
      return { success: false, message: typeof msg === 'string' ? msg : JSON.stringify(msg) };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const result = await authApi.register({ username, email, password });
      return { success: true, message: result };
    } catch (err) {
      const msg = err.response?.data || err.message || 'Đăng ký thất bại';
      return { success: false, message: typeof msg === 'string' ? msg : JSON.stringify(msg) };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

