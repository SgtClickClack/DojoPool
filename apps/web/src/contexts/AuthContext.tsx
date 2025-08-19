import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '../services/ApiService';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    skillRating?: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setError(null);
      setLoading(true);

      const result = await apiService.login(credentials);
      setUser(result.user);

      // Clear any previous errors
      setError(null);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
  }) => {
    try {
      setError(null);
      setLoading(true);

      const result = await apiService.register(userData);

      if (result.success) {
        // Registration successful, but user needs to log in
        setError(null);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await apiService.logout();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError('An error occurred during logout');
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
