'use client';

import { useAdminAuth as useAdminAuthContext } from '../context/AdminAuthContext';

export interface UseAdminAuthReturn {
  user: import('../api/adminTypes').AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<boolean>;
  error: string | null;
}

/**
 * Custom hook for accessing admin authentication state
 * 
 * @returns Object containing:
 * - user: Current authenticated user or null
 * - isLoading: Whether auth state is being loaded
 * - isAuthenticated: Whether user is logged in
 * - login: Function to login with email and password
 * - logout: Function to logout
 * - verify: Function to verify current token
 * - error: Error message if any
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAdminAuth();
 * ```
 */
export function useAdminAuth(): UseAdminAuthReturn {
  return useAdminAuthContext();
}
