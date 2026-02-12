import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost } from '@/integrations/api/client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'gerente' | 'tecnico';
  profile_id?: string;
  phone?: string;
  avatar_url?: string;
  active?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const data = await apiGet<{ user: AuthUser | null }>('/api/auth/me');
        if (isMounted) setUser(data.user);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await apiPost('/api/auth/login', { email, password });
      const data = await apiGet<{ user: AuthUser | null }>('/api/auth/me');
      setUser(data.user);
      return !!data.user;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost('/api/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const data = await apiGet<{ user: AuthUser | null }>('/api/auth/me');
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshProfile, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
