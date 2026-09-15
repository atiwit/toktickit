import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const API_BASE = 'http://localhost:3001';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';
  mustChangePassword: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from cookie via /api/auth/me
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        return { success: true, user: data.user as AuthUser };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Unable to connect. Please try again later.' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors — clear local state anyway
    }
    setUser(null);
  };

  const changePassword = async (newPassword: string, confirmPassword: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Password change failed' };
    } catch {
      return { success: false, error: 'Unable to connect. Please try again later.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
