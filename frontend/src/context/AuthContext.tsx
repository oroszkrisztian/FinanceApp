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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadStoredAuth = () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (storedToken) {
        if (!isTokenExpired(storedToken)) {
          const payload = decodeToken(storedToken);
          if (payload) {
            setToken(storedToken);
            setUserId(payload.userId);
            setUsername(payload.username);
          }
        } else {
          console.log('Token expired, clearing auth data');
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      }
    };

    loadStoredAuth();
  }, []);

  const login = (newToken: string, remember: boolean = true) => {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    
    otherStorage.removeItem('token');
    storage.setItem('token', newToken);
    
    const payload = decodeToken(newToken);
    setToken(newToken);
    
    if (payload) {
      setUserId(payload.userId);
      setUsername(payload.username);
    }
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  };

  const isTokenValid = (): boolean => {
    if (!token) return false;
    return !isTokenExpired(token);
  };

  const isAuthenticated = !!token && !!userId && isTokenValid();

  const value = {
    userId,
    username,
    isAuthenticated,
    token,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};