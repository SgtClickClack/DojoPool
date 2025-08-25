import { authApi, type AuthResponse, type User } from '@/services/api/auth';
import { useCallback, useEffect, useState } from 'react';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  resetRequestSent: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    resetRequestSent: false,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Validate token and fetch user data
          const currentUser = await authApi.getCurrentUser();
          setState((prev) => ({
            ...prev,
            user: currentUser,
            loading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
          }));
        }
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response: AuthResponse = await authApi.login({ email, password });

      // Store tokens securely
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      setState((prev) => ({
        ...prev,
        user: response.user,
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout API fails, clear local state
      console.error('Logout API error:', error);
    } finally {
      // Clear local state regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setState((prev) => ({
        ...prev,
        user: null,
      }));
    }
  }, []);

  const getToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    return token;
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      // TODO: Implement password reset API call when backend endpoint is available
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Password reset request failed');
      }

      setState((prev) => ({
        ...prev,
        resetRequestSent: true,
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response: AuthResponse = await authApi.register({
          email,
          password,
          name,
        });

        // Store tokens securely
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);

        setState((prev) => ({
          ...prev,
          user: response.user,
          loading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Registration failed';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        throw error;
      }
    },
    []
  );

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    resetRequestSent: state.resetRequestSent,
    login,
    logout,
    getToken,
    sendPasswordResetEmail,
    register,
  };
};
