import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface User {
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (u: string, p: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useLocation();

  // Persist login
  useEffect(() => {
    const stored = localStorage.getItem('mock_auth_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (u: string, p: string) => {
    // Mock credentials
    if (u === 'admin' && p === 'admin123') {
      const userObj = { username: 'admin', role: 'admin' as const };
      setUser(userObj);
      localStorage.setItem('mock_auth_user', JSON.stringify(userObj));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mock_auth_user');
    setLocation('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
