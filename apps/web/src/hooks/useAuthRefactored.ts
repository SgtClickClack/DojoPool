/**
 * Unified Authentication Hook
 * 
 * Consolidates authentication logic, eliminates duplication,
 * and provides consistent auth state management.
 * 
 * Features:
 * - Unified session management with NextAuth
 * - Centralized error handling
 * - Optimized re-renders
 * - Consistent user data normalization
 * - Admin role validation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  clanId?: string;
  clanRole?: 'member' | 'leader';
  avatarUrl?: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for checking admin status consistently
 */
const useIsAdmin = (user: any): boolean => {
  return useMemo(() => {
    if (!user) return false;
    
    const role = user.role?.toString()?.toUpperCase();
    if (role === 'ADMIN') return true;
    
    return Boolean(user.isAdmin);
  }, [user]);
};

/**
 * Hook for normalizing user data from session and API responses
 */
const useUserNormalization = (sessionUser: any, fetchedUser: any): User | null => {
  return useMemo(() => {
    if (!sessionUser && !fetchedUser) return null;

    const merged = {
      ...(sessionUser ?? {}),
      ...(fetchedUser ?? {}),
    };

    return {
      id: merged.id || '',
      email: merged.email || '',
      username: merged.username || merged.name || merged.email?.split('@')[0] || '',
      name: merged.name,
      role: merged.role || 'USER',
      clanId: merged.clanId,
      clanRole: merged.clanRole,
      avatarUrl: merged.avatarUrl || merged.image,
      isAdmin: false, // Will be calculated separately
    };
  }, [sessionUser, fetchedUser]);
};

/**
 * Main authentication hook with optimized performance
 */
export const useAuth = (): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
} => {
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Memoized admin check
  const isAdmin = useIsAdmin(authState.user);

  /**
   * Fetches complete user data from API
   */
  const fetchUserData = useCallback(async (sessionUser: any): Promise<any> => {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include',
        cache: 'no-cache',
      });

      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  }, []);

  /**
   * Updates auth state with normalized user data
   */
  const updateAuthState = useCallback(async () => {
    if (status === 'loading') return;

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const sessionUser = session?.user ?? null;
      const fetchedUser = sessionUser ? await fetchUserData(sessionUser) : null;
      
      const normalizedUser = useUserNormalization(sessionUser, fetchedUser);
      
      if (normalizedUser) {
        normalizedUser.isAdmin = useIsAdmin(normalizedUser);
      }

      setAuthState({
        user: normalizedUser,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Authentication state resolution failed:', error);
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, [session, status, fetchUserData, useUserNormalization]);

  /**
   * Optimized effect with proper cleanup
   */
  useEffect(() => {
    updateAuthState();
  }, [updateAuthState]);

  /**
   * Login function with error handling
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({ ...prev, error: message }));
      throw error;
    }
  }, []);

  /**
   * Registration function
   */
  const register = useCallback(async (
    email: string,
    password: string,
    username: string
  ): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      // Auto-login after successful registration
      await login(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({ ...prev, error: message }));
      throw error;
    }
  }, [login]);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut({ redirect: false });
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState(prev => ({ ...prev, error: 'Logout failed' }));
    }
  }, []);

  /**
   * Clear error function
   */
  const clearError = useCallback((): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Refresh user data function
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    await updateAuthState();
  }, [updateAuthState]);

  return {
    ...authState,
    isAdmin,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };
};

export default useAuth;
