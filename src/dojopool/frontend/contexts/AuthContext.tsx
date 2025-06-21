import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  joinDate: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  achievements: string[];
  recentGames: any[];
  rank: number;
  dojoCoins: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await axios.get("/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      // For now, we'll simulate a successful login since the backend doesn't have auth endpoints yet
      // In a real app, this would call the actual login endpoint
      const mockUser = {
        id: "ARGYvR9TD7aioeObfsLqxuPbmCv2",
        username: "demo_user",
        email: email,
        avatar: "",
        joinDate: new Date().toISOString(),
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        achievements: [],
        recentGames: [],
        rank: 1,
        dojoCoins: 0
      };
      
      const mockToken = "mock-jwt-token-" + Date.now();
      localStorage.setItem("token", mockToken);
      setUser(mockUser);
    } catch (error) {
      console.error("Login failed:", error);
      setError("Invalid email or password");
      throw error;
    }
  };

  const logout = async () => {
    try {
      // In a real app, you'd call the logout endpoint
      // await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      // For now, we'll simulate a successful registration
      const mockUser = {
        id: "ARGYvR9TD7aioeObfsLqxuPbmCv2",
        username: name,
        email: email,
        avatar: "",
        joinDate: new Date().toISOString(),
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        achievements: [],
        recentGames: [],
        rank: 1,
        dojoCoins: 0
      };
      
      const mockToken = "mock-jwt-token-" + Date.now();
      localStorage.setItem("token", mockToken);
      setUser(mockUser);
    } catch (error) {
      console.error("Registration failed:", error);
      setError("Registration failed. Please try again.");
      throw error;
    }
  };

  // Configure axios interceptors for token handling
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setUser(null);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    register,
    loading,
    error,
  };

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
