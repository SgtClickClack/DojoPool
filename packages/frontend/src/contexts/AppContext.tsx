import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context type
interface AppContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

// Create the context with default values
const AppContext = createContext<AppContextType>({
  isLoading: false,
  setLoading: () => {},
  error: null,
  setError: () => {},
  clearError: () => {},
  showNotification: () => {},
});

// Custom hook to use the app context
export const useAppContext = () => useContext(AppContext);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Function to show notifications (can be integrated with a notification library)
  const showNotification = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning'
  ) => {
    // This is a placeholder. In a real app, you would integrate with a notification library
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // You could use something like react-toastify here
    // toast[type](message);
  };

  const value = {
    isLoading,
    setLoading,
    error,
    setError,
    clearError,
    showNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext; 