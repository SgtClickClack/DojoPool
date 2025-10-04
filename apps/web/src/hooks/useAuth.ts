import { useSession, signIn, signOut } from 'next-auth/react';
import React, {
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

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

interface AuthContextType {
  user: User | null;
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

export const useAuth = (): AuthContextType => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    let isMounted = true;

    const resolveIsAdmin = (candidate: any | null | undefined): boolean => {
      if (!candidate) {
        return false;
      }

      const role = (candidate.role ?? candidate?.role)?.toString();
      if (role && role.toUpperCase() === 'ADMIN') {
        return true;
      }

      if (typeof candidate.isAdmin === 'boolean') {
        return candidate.isAdmin;
      }

      return false;
    };

    const normalizeUser = (base: any | null, fetched: any | null) => {
      if (!base && !fetched) {
        return null;
      }

      const combined = {
        ...(base ?? {}),
        ...(fetched ?? {}),
      } as any;

      if (!combined.username) {
        combined.username =
          fetched?.username ??
          fetched?.name ??
          base?.username ??
          base?.name ??
          combined.email?.split?.('@')[0] ??
          null;
      }

      if (!combined.role && fetched?.role) {
        combined.role = fetched.role;
      }

      return combined;
    };

    const loadUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const sessionUser = session?.user ?? null;

        let fetchedUser: any | null = null;

        try {
          const response = await fetch('/api/users/me', {
            credentials: 'include',
          });

          if (response.ok) {
            fetchedUser = await response.json();
          } else if (response.status === 401) {
            fetchedUser = null;
          } else {
            const errorText = await response.text();
            console.error('Failed to fetch current user:', errorText);
          }
        } catch (fetchError) {
          console.error('Failed to fetch current user:', fetchError);
        }

        if (!isMounted) {
          return;
        }

        const mergedUser = normalizeUser(sessionUser, fetchedUser);
        setUser(mergedUser);
        setIsAdmin(resolveIsAdmin(mergedUser));
      } catch (err) {
        console.error('Authentication state resolution failed:', err);
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setError('Unable to determine authentication state');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      
      // Validate input
      const validatedInput = loginSchema.parse({ email, password });
      
      const res = await signIn('credentials', {
        email: validatedInput.email,
        password: validatedInput.password,
        redirect: false,
      });
      
      if (res?.error) {
        setError('Invalid credentials');
        throw new Error('Login failed');
      }
      // Session will update automatically
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Invalid input');
      } else {
        setError('Login failed');
      }
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
      
      // Validate input
      const validatedInput = registerSchema.parse({ email, password, username });
      
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: validatedInput.email, 
          password: validatedInput.password, 
          username: validatedInput.username 
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        setError(errorData.message || 'Registration failed');
        return;
      }

      // Auto sign in
      const signInResponse = await signIn('credentials', {
        email: validatedInput.email,
        password: validatedInput.password,
        redirect: false,
      });

      if (signInResponse?.error) {
        setError('Registration successful, but login failed.');
      } else {
        // Session updates
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Invalid input');
      } else {
        setError('Registration failed');
      }
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

  return {
    user,
    loading,
    isAdmin,
    error,
    login,
    register,
    logout,
    clearError,
  };
};
