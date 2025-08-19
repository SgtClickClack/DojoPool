import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// Minimal user shape for frontend usage without pulling external deps
export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Local, dependency-light provider used for type-check isolation.
// If you have a real Firebase-based provider elsewhere, you can later
// swap implementations while keeping this file as the stable public API
// for the frontend.
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user] = useState<AuthUser | null>(null);
  const [loading] = useState<boolean>(false);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    // Lightweight stubs for type-check; integrate real logic as needed
    async signIn() {
      return Promise.resolve();
    },
    async signInWithGoogle() {
      return Promise.resolve();
    },
    async signOut() {
      return Promise.resolve();
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
