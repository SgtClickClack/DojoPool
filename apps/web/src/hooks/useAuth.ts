import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // For demo purposes, create a mock user
    const mockUser: User = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      username: 'DemoUser',
    };
    setUser(mockUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app this would call the API
    const mockUser: User = {
      id: 'demo-user-123',
      email,
      username: email.split('@')[0],
    };
    setUser(mockUser);
    setIsAdmin(email.endsWith('@dojopool.com'));
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
  };

  return {
    user,
    loading,
    isAdmin,
    login,
    logout,
  };
};
