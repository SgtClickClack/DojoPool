import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext'; // Depend on AuthContext
import axiosInstance from '../api/axiosInstance';

// Define the structure of the user profile data we expect from the backend
interface UserProfile {
  id: number; // The internal database ID
  username: string;
  email: string;
  profile_picture?: string;
  // Add other relevant fields returned by /users/me endpoint
  // e.g., first_name, last_name, roles, etc.
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>; // Function to manually refetch if needed
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: firebaseUser, loading: authLoading } = useAuth(); // Get Firebase user from AuthContext
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!firebaseUser) {
      setProfile(null); // Clear profile if no Firebase user
      setIsLoading(false);
      return; // Don't fetch if not authenticated
    }

    setIsLoading(true);
    setError(null);
    try {
      // Assumes the endpoint is mounted under /users/
      const response = await axiosInstance.get<{ data: { user: UserProfile } }>('/users/me');
      if (response.data?.data?.user) {
        setProfile(response.data.data.user);
      } else {
        throw new Error('User profile data not found in API response.');
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load user profile.');
      setProfile(null); // Clear profile on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch profile whenever the Firebase user changes (login/logout)
    // or when auth is no longer loading initially.
    if (!authLoading) {
      fetchProfile();
    }
  }, [firebaseUser, authLoading]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    profile,
    isLoading,
    error,
    fetchProfile,
  }), [profile, isLoading, error]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 