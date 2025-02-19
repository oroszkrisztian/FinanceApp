import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: Date;
}

interface StoredUser extends Omit<User, 'createdAt'> {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: StoredUser | null) => void;
  userId: number | null;
  isAuthenticated: boolean;
  logout: () => void;
  token: string | null;
  setAuthData: (user: StoredUser, token: string, remember?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadStoredAuth = () => {
      // Check both storages
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedToken && userStr) {
        try {
          const userData: StoredUser = JSON.parse(userStr);
          setToken(storedToken);
          // Convert the stored string date back to Date object
          setUser({
            ...userData,
            createdAt: new Date(userData.createdAt)
          });
        } catch (error) {
          console.error('Error parsing stored auth data:', error);
          // Clear both storages if there's an error
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('token');
        }
      }
    };

    loadStoredAuth();
  }, []);

  const setAuthData = (userData: StoredUser, newToken: string, remember: boolean = true) => {
    const storage = remember ? localStorage : sessionStorage;
    
    // Clear other storage to prevent conflicts
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem('token');
    otherStorage.removeItem('user');

    // Store in selected storage
    storage.setItem('token', newToken);
    storage.setItem('user', JSON.stringify(userData));

    setToken(newToken);
    setUser({
      ...userData,
      createdAt: new Date(userData.createdAt)
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Clear both storages on logout
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  const value = {
    user,
    setUser: (userData: StoredUser | null) => {
      if (userData) {
        setUser({
          ...userData,
          createdAt: new Date(userData.createdAt)
        });
      } else {
        setUser(null);
      }
    },
    userId: user?.id || null,
    isAuthenticated: !!user && !!token,
    token,
    logout,
    setAuthData
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