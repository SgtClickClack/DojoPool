import authService, { User } from '@/services/authService';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator?: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  clearError: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAdmin(currentUser.isAdmin || false);
            setIsModerator(
              currentUser.role === 'MODERATOR' || currentUser.isAdmin || false
            );
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login({ usernameOrEmail, password });
      setUser(response.user);
      setIsAdmin(response.user.isAdmin || false);
      setIsModerator(
        response.user.role === 'MODERATOR' || response.user.isAdmin || false
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      setError(null);
      const response = await authService.register({
        email,
        password,
        username,
      });
      setUser(response.user);
      setIsAdmin(response.user.isAdmin || false);
      setIsModerator(
        response.user.role === 'MODERATOR' || response.user.isAdmin || false
      );
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAdmin(false);
      setIsModerator(false);
    } catch (err) {
      console.error('Logout error:', err);
      // Force logout even if API call fails
      setUser(null);
      setIsAdmin(false);
    }
  };

  const setToken = async (token: string) => {
    try {
      setError(null);
      // Store the token
      authService.setToken(token);
      // Get user info with the new token
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(currentUser.isAdmin || false);
        setIsModerator(
          currentUser.role === 'MODERATOR' || currentUser.isAdmin || false
        );
      }
    } catch (err: any) {
      setError(err.message || 'Token validation failed');
      throw err;
    }
  };

  const refetchUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (err) {
      console.error('Failed to refetch user:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    isModerator,
    error,
    login,
    register,
    logout,
    setToken,
    clearError,
    refetchUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
