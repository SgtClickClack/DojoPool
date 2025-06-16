import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  token: string;
}

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
    const token = localStorage.getItem("token");
    if (token) {
      // TODO: Validate token and fetch user data
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      // TODO: Implement login API call
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      setState((prev) => ({
        ...prev,
        user: data.user,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      }));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setState((prev) => ({
      ...prev,
      user: null,
    }));
  }, []);

  const getToken = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }
    return token;
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      // TODO: Implement password reset API call
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Password reset request failed");
      }

      setState((prev) => ({
        ...prev,
        resetRequestSent: true,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      }));
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        // TODO: Implement registration API call
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
          throw new Error("Registration failed");
        }

        const data = await response.json();
        localStorage.setItem("token", data.token);
        setState((prev) => ({
          ...prev,
          user: data.user,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "An error occurred",
          loading: false,
        }));
      }
    },
    [],
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
