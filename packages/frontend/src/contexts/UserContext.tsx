import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id?: string;
  username?: string;
  email?: string;
  ethereumAddress?: string | null;
  solanaAddress?: string | null;
  avatar?: string;
  isAdmin?: boolean;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    [key: string]: any;
  };
  stats?: {
    tournamentsPlayed?: number;
    tournamentsWon?: number;
    totalWinnings?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  updateUser: (userData: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to update specific user properties
  const updateUser = (userData: User) => {
    setUser(prevUser => {
      if (!prevUser) return userData;
      return { ...prevUser, ...userData };
    });
  };

  // Function to handle user logout
  const logout = () => {
    // Perform any cleanup needed
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    error,
    updateUser,
    setUser,
    logout
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

export default UserContext; 