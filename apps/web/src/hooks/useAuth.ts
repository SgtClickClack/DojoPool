import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import React, {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  user: any | null; // Adjust type based on NextAuth User
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (status === 'loading') return;
      if (session) {
        setUser(session.user);
        setIsAdmin(session.user.role === 'ADMIN'); // Adjust based on role
      }
      setLoading(false);
    };
    checkAuth();
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid credentials');
        throw new Error('Login failed');
      }
      // Session will update automatically
    } catch (err) {
      setError('Login failed');
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        setError(errorData.message || 'Registration failed');
        return;
      }

      // Auto sign in
      const signInResponse = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResponse?.error) {
        setError('Registration successful, but login failed.');
      } else {
        // Session updates
      }
    } catch (err) {
      setError('Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      setUser(null);
      setIsAdmin(false);
    } catch (err) {
      setUser(null);
      setIsAdmin(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user: session?.user || null,
    loading: status === 'loading',
    isAdmin,
    error,
    login,
    register,
    logout,
    clearError,
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
