import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { api } from '@/api/mockApi';
import { User } from '@/types/schema';

const ADMIN_EMAIL = "hneves@rha-technologies.pt";
const ADMIN_PASSWORD_MOCK_HASH = "Admin123!"; 

interface AdminUser {
  email: string;
  role: 'admin';
}

interface AuthContextType {
  user: User | null; // Normal User
  admin: AdminUser | null; // Admin Session
  loginUser: (email: string, pass: string) => Promise<boolean>;
  logoutUser: () => void;
  loginAdmin: (email: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();

  // Restore sessions
  useEffect(() => {
    const restoreSessions = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Restore Admin
      const adminSession = localStorage.getItem('mock_admin_session');
      if (adminSession) {
        setAdmin({ email: ADMIN_EMAIL, role: 'admin' });
      }

      // Restore User
      const userSession = localStorage.getItem('mock_user_session');
      if (userSession) {
        setUser(JSON.parse(userSession));
      }

      setIsLoading(false);
    };
    restoreSessions();
  }, []);

  // --- Normal User Actions ---
  const loginUser = async (email: string, pass: string): Promise<boolean> => {
    const foundUser = await api.users.checkCredentials(email, pass);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mock_user_session', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('mock_user_session');
    setLocation('/login');
  };

  // --- Admin Actions ---
  const loginAdmin = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD_MOCK_HASH) {
      const adminObj: AdminUser = { email: ADMIN_EMAIL, role: 'admin' };
      setAdmin(adminObj);
      localStorage.setItem('mock_admin_session', 'valid_admin_token');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setAdmin(null);
    localStorage.removeItem('mock_admin_session');
    // Redirect to Dashboard (which will check for User session) or User Login
    setLocation('/'); 
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      admin, 
      loginUser, 
      logoutUser, 
      loginAdmin, 
      logoutAdmin, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
