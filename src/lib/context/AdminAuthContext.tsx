'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser, AdminAuthResponse } from '../api/adminTypes';
import { AdminAuthAPI } from '../api/adminEndpoints';
import {
  clearAdminAuthMarker,
  hasAdminAuthMarker,
  setAdminAuthMarker,
} from '../auth/adminAuthMarker';

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<boolean>;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toMessage = (err: unknown): string =>
    err instanceof Error ? err.message : 'Authentication request failed';

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!hasAdminAuthMarker()) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await AdminAuthAPI.verify();
        if (response.valid && response.user) {
          setUser(response.user);
          setAdminAuthMarker();
        } else {
          setUser(null);
          clearAdminAuthMarker();
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        setUser(null);
        clearAdminAuthMarker();
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: AdminAuthResponse = await AdminAuthAPI.login({ email, password });

      if (response.user) {
        setUser(response.user);
        setAdminAuthMarker();
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (err: unknown) {
      clearAdminAuthMarker();
      setError(toMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AdminAuthAPI.logout();
    } finally {
      setUser(null);
      clearAdminAuthMarker();
      setIsLoading(false);
    }
  }, []);

  const verify = useCallback(async (): Promise<boolean> => {
    try {
      const response = await AdminAuthAPI.verify();
      if (response.valid && response.user) {
        setUser(response.user);
        setAdminAuthMarker();
        return true;
      }
      setUser(null);
      clearAdminAuthMarker();
      return false;
    } catch {
      setUser(null);
      clearAdminAuthMarker();
      return false;
    }
  }, []);

  const value: AdminAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    verify,
    error,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
