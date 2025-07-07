import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface VenuePerformance {
  venueId: string;
  venueName: string;
  totalMatches: number;
  totalTournaments: number;
  totalPlayers: number;
  averageRating: number;
  revenue: number;
  activityScore: number;
  lastUpdated: Date;
}

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  venueId: string;
  matchesWon: number;
  matchesPlayed: number;
  tournamentsWon: number;
  tournamentsPlayed: number;
  winRate: number;
  totalEarnings: number;
  rating: number;
  lastActive: Date;
}

export interface DojoMaster {
  venueId: string;
  venueName: string;
  masterId: string;
  masterName: string;
  designationDate: Date;
  achievements: string[];
  privileges: string[];
  reignDuration: number;
  totalDefenses: number;
  successfulDefenses: number;
}

export interface LeaderboardEntry {
  rank: number;
  venueId: string;
  venueName: string;
  performance: VenuePerformance;
  dojoMaster?: DojoMaster;
  topPlayers: PlayerPerformance[];
  weeklyChange: number;
  monthlyChange: number;
}

interface UseVenueLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refreshLeaderboard: () => Promise<void>;
  getVenuePerformance: (venueId: string) => Promise<VenuePerformance | null>;
  getPlayerPerformance: (playerId: string, venueId: string) => Promise<PlayerPerformance | null>;
  getDojoMaster: (venueId: string) => Promise<DojoMaster | null>;
  getAllDojoMasters: () => Promise<DojoMaster[]>;
  getTopPlayers: (venueId: string, limit?: number) => Promise<PlayerPerformance[]>;
  updateVenuePerformance: (venueId: string, activity: any) => Promise<void>;
  updatePlayerPerformance: (playerId: string, venueId: string, performance: any) => Promise<void>;
  designateDojoMaster: (venueId: string, playerId: string, playerName: string) => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const useVenueLeaderboard = (): UseVenueLeaderboardReturn => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('venue-leaderboard:updated', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
      setLoading(false);
    });

    newSocket.on('venue-leaderboard:dojo-master-designated', (dojoMaster: DojoMaster) => {
      // Update leaderboard with new Dojo Master
      setLeaderboard(prev => 
        prev.map(entry => 
          entry.venueId === dojoMaster.venueId 
            ? { ...entry, dojoMaster }
            : entry
        )
      );
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to leaderboard service');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const result = await response.json();
      if (result.success) {
        setLeaderboard(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Refresh leaderboard
  const refreshLeaderboard = useCallback(async () => {
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Get venue performance
  const getVenuePerformance = useCallback(async (venueId: string): Promise<VenuePerformance | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/venue/${venueId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch venue performance');
      }
      
      const result = await response.json();
      return result.success ? result.data.performance : null;
    } catch (err) {
      console.error('Error fetching venue performance:', err);
      return null;
    }
  }, []);

  // Get player performance
  const getPlayerPerformance = useCallback(async (playerId: string, venueId: string): Promise<PlayerPerformance | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/player/${playerId}/${venueId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch player performance');
      }
      
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Error fetching player performance:', err);
      return null;
    }
  }, []);

  // Get Dojo Master for venue
  const getDojoMaster = useCallback(async (venueId: string): Promise<DojoMaster | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/dojo-master/${venueId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch Dojo Master');
      }
      
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Error fetching Dojo Master:', err);
      return null;
    }
  }, []);

  // Get all Dojo Masters
  const getAllDojoMasters = useCallback(async (): Promise<DojoMaster[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/dojo-masters`);
      if (!response.ok) {
        throw new Error('Failed to fetch Dojo Masters');
      }
      
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (err) {
      console.error('Error fetching Dojo Masters:', err);
      return [];
    }
  }, []);

  // Get top players for venue
  const getTopPlayers = useCallback(async (venueId: string, limit: number = 10): Promise<PlayerPerformance[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/top-players/${venueId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch top players');
      }
      
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (err) {
      console.error('Error fetching top players:', err);
      return [];
    }
  }, []);

  // Update venue performance
  const updateVenuePerformance = useCallback(async (venueId: string, activity: any): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/venue-performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId, activity }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update venue performance');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update venue performance');
      }
    } catch (err) {
      console.error('Error updating venue performance:', err);
      throw err;
    }
  }, []);

  // Update player performance
  const updatePlayerPerformance = useCallback(async (playerId: string, venueId: string, performance: any): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/player-performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId, venueId, performance }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update player performance');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update player performance');
      }
    } catch (err) {
      console.error('Error updating player performance:', err);
      throw err;
    }
  }, []);

  // Designate Dojo Master
  const designateDojoMaster = useCallback(async (venueId: string, playerId: string, playerName: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venue-leaderboard/designate-master`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId, playerId, playerName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to designate Dojo Master');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to designate Dojo Master');
      }
    } catch (err) {
      console.error('Error designating Dojo Master:', err);
      throw err;
    }
  }, []);

  return {
    leaderboard,
    loading,
    error,
    refreshLeaderboard,
    getVenuePerformance,
    getPlayerPerformance,
    getDojoMaster,
    getAllDojoMasters,
    getTopPlayers,
    updateVenuePerformance,
    updatePlayerPerformance,
    designateDojoMaster,
  };
}; 