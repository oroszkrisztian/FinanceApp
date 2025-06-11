import React, { createContext, useContext, useState, useEffect } from 'react';

interface TokenPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

interface AuthContextType {
  userId: number | null;
  username: string | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string, remember?: boolean) => void;
  logout: () => void;
  checkAndRefreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const clearAuth = () => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  };

  const setAuthData = (newToken: string) => {
    const payload = decodeToken(newToken);
    setToken(newToken);
    if (payload) {
      setUserId(payload.userId);
      setUsername(payload.username);
    }
  };

  const checkAndRefreshToken = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!storedToken) {
      return false;
    }

    if (!isTokenExpired(storedToken)) {
      if (!token) {
        setAuthData(storedToken);
      }
      return true;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedToken })
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const data = await response.json();
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      setAuthData(data.token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
      return false;
    }
  };

  useEffect(() => {
    checkAndRefreshToken();
  }, []);

  const login = (newToken: string, remember: boolean = true) => {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    
    otherStorage.removeItem('token');
    storage.setItem('token', newToken);
    setAuthData(newToken);
  };

  const logout = () => {
    clearAuth();
  };

  const isAuthenticated = !!token && !!userId && !isTokenExpired(token);

  const value = {
    userId,
    username,
    isAuthenticated,
    token,
    login,
    logout,
    checkAndRefreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };