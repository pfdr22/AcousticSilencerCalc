import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// Simulated Admin Config
const ADMIN_EMAIL = "hneves@rha-technologies.pt";
// In a real app, this would be a bcrypt hash on the server. 
// Here we simulate the hash verification.
const ADMIN_PASSWORD_MOCK_HASH = "Admin123!"; 

interface User {
  email: string;
  role: 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();

  // Simulate Session Check on Mount (GET /api/admin/me)
  useEffect(() => {
    const checkSession = async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check "cookie" (simulated by localStorage for mockup)
      const stored = localStorage.getItem('mock_session_id');
      if (stored) {
        // If session exists, restore user
        setUser({ email: ADMIN_EMAIL, role: 'admin' });
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Simulate POST /api/admin/login
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate credentials (mocking server-side hash check)
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD_MOCK_HASH) {
      const userObj: User = { email: ADMIN_EMAIL, role: 'admin' };
      setUser(userObj);
      // Create "session"
      localStorage.setItem('mock_session_id', 'valid_session_token');
      return true;
    }
    return false;
  };

  const logout = async () => {
    // Simulate POST /api/admin/logout
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setUser(null);
    localStorage.removeItem('mock_session_id');
    setLocation('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
