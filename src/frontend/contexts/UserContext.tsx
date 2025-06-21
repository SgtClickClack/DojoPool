import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useAuth } from "../../components/auth/AuthContext"; // Fixed import path to match main.tsx
import axiosInstance from "../api/axiosInstance";

// Define the structure of the user profile data we expect from the backend
interface UserProfile {
  id: string; // The internal database ID
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
    throw new Error("useUserProfile must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user: authUser, loading: authLoading } = useAuth(); // Get user from AuthContext
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!authUser) {
      setProfile(null); // Clear profile if no authenticated user
      setIsLoading(false);
      return; // Don't fetch if not authenticated
    }

    setIsLoading(true);
    setError(null);
    try {
      // Use the correct endpoint that matches the backend
      const response = await axiosInstance.get<{ data: UserProfile }>(
        "/api/v1/users/me",
      );
      if (response.data?.data) {
        setProfile(response.data.data);
      } else {
        throw new Error("User profile data not found in API response.");
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load user profile.",
      );
      setProfile(null); // Clear profile on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch profile whenever the authenticated user changes (login/logout)
    // or when auth is no longer loading initially.
    if (!authLoading) {
      fetchProfile();
    }
  }, [authUser, authLoading]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      profile,
      isLoading,
      error,
      fetchProfile,
    }),
    [profile, isLoading, error],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
