import { authApi, type AuthResponse } from '@/services/api/auth';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Extended user interface to match backend User type
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  displayName?: string;
  photoURL?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Session persistence on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Validate token and fetch current user
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser as AuthUser);
        }
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response: AuthResponse = await authApi.login({ email, password });

      // Store tokens securely
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Set user in context
      setUser(response.user as AuthUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    // TODO: Implement Google OAuth integration
    setError('Google authentication not yet implemented');
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout API fails, clear local state
      console.error('Logout API error:', error);
    } finally {
      // Clear local state regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const response: AuthResponse = await authApi.register({
        email,
        password,
        name,
      });

      // Store tokens securely
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Set user in context
      setUser(response.user as AuthUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signIn,
      signInWithGoogle,
      signOut,
      register,
      clearError,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
