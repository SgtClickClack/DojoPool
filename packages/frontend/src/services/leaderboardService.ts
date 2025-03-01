import { analyticsService } from './analytics';
import { toast } from 'react-toastify';
import axios from 'axios';
import websocketService from './websocketService';

// Types
export interface LeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  lastActive: string;
  venue?: string;
  isCurrentUser?: boolean;
  gainedPoints?: number; // Points gained in recent time period
}

export interface LeaderboardFilter {
  timeFrame?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  venue?: string;
  gameType?: string;
  limit?: number;
  offset?: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalEntries: number;
  userRank?: LeaderboardEntry; // Current user's ranking if they appear on the leaderboard
  lastUpdated: string;
  venueName?: string; // Name of the venue for venue-specific leaderboards
}

export interface TournamentLeaderboardEntry extends LeaderboardEntry {
  tournamentId: string;
  tournamentName: string;
  entryFee: string;
  entryFeeCurrency: 'ETH' | 'SOL';
  position: number;
  winnings?: string;
  eliminated: boolean;
  matchesPlayed?: number;
}

export interface TournamentLeaderboardData {
  entries: TournamentLeaderboardEntry[];
  tournamentName: string;
  lastUpdated: string;
  tournamentId: string;
}

const DEFAULT_LIMIT = 20;
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.dojopool.com';

/**
 * Service for handling leaderboard operations
 */
class LeaderboardService {
  /**
   * Fetch global leaderboard data with optional filters
   */
  async getGlobalLeaderboard(filters: LeaderboardFilter = {}): Promise<LeaderboardData> {
    try {
      analyticsService.trackEvent('leaderboard_fetch_initiated', { 
        timeFrame: filters.timeFrame || 'allTime',
        venue: filters.venue,
        gameType: filters.gameType
      });

      // Set default values for pagination
      const limit = filters.limit || DEFAULT_LIMIT;
      const offset = filters.offset || 0;

      // Prepare query parameters
      const params = new URLSearchParams();
      if (filters.timeFrame) params.append('timeFrame', filters.timeFrame);
      if (filters.venue) params.append('venue', filters.venue);
      if (filters.gameType) params.append('gameType', filters.gameType);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      // Make API request
      const response = await axios.get(`${API_BASE_URL}/api/leaderboard/global?${params.toString()}`);
      
      analyticsService.trackEvent('leaderboard_fetch_success', { 
        entriesCount: response.data.entries.length,
        totalEntries: response.data.totalEntries
      });

      return {
        entries: response.data.entries,
        totalEntries: response.data.totalEntries,
        userRank: response.data.userRank,
        lastUpdated: response.data.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      analyticsService.trackEvent('leaderboard_fetch_error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Error fetching global leaderboard:', error);
      toast.error('Failed to load leaderboard data. Please try again.');
      
      // Return empty data on error
      return {
        entries: [],
        totalEntries: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch tournament-specific leaderboard
   */
  async getTournamentLeaderboard(tournamentId: string, options: { limit?: number } = {}): Promise<TournamentLeaderboardData> {
    try {
      analyticsService.trackEvent('tournament_leaderboard_fetch_initiated', { tournamentId });

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await axios.get(`${API_BASE_URL}/api/tournaments/${tournamentId}/leaderboard?${params.toString()}`);
      
      analyticsService.trackEvent('tournament_leaderboard_fetch_success', {
        tournamentId,
        entriesCount: response.data.entries.length
      });

      return {
        entries: response.data.entries,
        tournamentName: response.data.tournamentName || '',
        lastUpdated: response.data.lastUpdated || new Date().toISOString(),
        tournamentId: response.data.tournamentId || ''
      };
    } catch (error) {
      analyticsService.trackEvent('tournament_leaderboard_fetch_error', { 
        tournamentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`Error fetching tournament leaderboard for tournament ${tournamentId}:`, error);
      toast.error('Failed to load tournament rankings. Please try again.');
      return {
        entries: [],
        tournamentName: '',
        lastUpdated: new Date().toISOString(),
        tournamentId: ''
      };
    }
  }

  /**
   * Get user's personal stats and rankings
   */
  async getUserStats(userId?: string): Promise<UserStatsData | null> {
    try {
      const endpoint = userId 
        ? `${API_BASE_URL}/api/users/${userId}/stats` 
        : `${API_BASE_URL}/api/users/me/stats`;

      analyticsService.trackEvent('user_stats_fetch_initiated', { userId: userId || 'me' });

      const response = await axios.get(endpoint);
      
      analyticsService.trackEvent('user_stats_fetch_success');

      return response.data;
    } catch (error) {
      analyticsService.trackEvent('user_stats_fetch_error', { 
        userId: userId || 'me',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load player statistics. Please try again.');
      return null;
    }
  }

  /**
   * Get venue-specific leaderboard
   */
  async getVenueLeaderboard(venueId: string, filters: LeaderboardFilter = {}): Promise<LeaderboardData> {
    try {
      analyticsService.trackEvent('venue_leaderboard_fetch_initiated', { 
        venueId, 
        timeFrame: filters.timeFrame || 'allTime'
      });

      // Set default values for pagination
      const limit = filters.limit || DEFAULT_LIMIT;
      const offset = filters.offset || 0;

      // Prepare query parameters
      const params = new URLSearchParams();
      if (filters.timeFrame) params.append('timeFrame', filters.timeFrame);
      if (filters.gameType) params.append('gameType', filters.gameType);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await axios.get(`${API_BASE_URL}/api/venues/${venueId}/leaderboard?${params.toString()}`);
      
      analyticsService.trackEvent('venue_leaderboard_fetch_success', { 
        venueId,
        entriesCount: response.data.entries.length,
        totalEntries: response.data.totalEntries
      });

      return {
        entries: response.data.entries,
        totalEntries: response.data.totalEntries,
        userRank: response.data.userRank,
        venueName: response.data.venueName,
        lastUpdated: response.data.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      analyticsService.trackEvent('venue_leaderboard_fetch_error', { 
        venueId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`Error fetching venue leaderboard for venue ${venueId}:`, error);
      toast.error('Failed to load venue rankings. Please try again.');
      
      // Return empty data on error
      return {
        entries: [],
        totalEntries: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Subscribe to real-time leaderboard updates (for live tournaments)
   * @returns An unsubscribe function
   */
  subscribeToLeaderboardUpdates(tournamentId: string, callback: (data: TournamentLeaderboardEntry[]) => void): () => void {
    // Use WebSockets for real-time updates
    if (!websocketService.isConnected()) {
      console.log('Connecting to WebSocket server for leaderboard updates');
      websocketService.connect({
        onError: () => {
          toast.error('Failed to connect to real-time updates. Rankings may be delayed.');
        }
      });
    }

    // Subscribe to tournament updates
    const unsubscribe = websocketService.subscribe<TournamentLeaderboardData>('leaderboard_update', (data) => {
      // Only process updates for the current tournament
      if (data.tournamentId === tournamentId) {
        callback(data.entries);
        analyticsService.trackEvent('leaderboard_ws_update_received', { 
          tournamentId,
          entriesCount: data.entries.length
        });
      }
    });

    // Send a message to request tournament subscription
    websocketService.send({
      type: 'leaderboard_update',
      data: { 
        action: 'subscribe', 
        tournamentId 
      }
    });

    analyticsService.trackEvent('leaderboard_live_subscription', { tournamentId });

    // Return a function to unsubscribe and send an unsubscribe message
    return () => {
      unsubscribe();
      
      if (websocketService.isConnected()) {
        websocketService.send({
          type: 'leaderboard_update',
          data: { 
            action: 'unsubscribe', 
            tournamentId 
          }
        });
      }
      
      analyticsService.trackEvent('leaderboard_live_unsubscription', { tournamentId });
    };
  }

  /**
   * Get leaderboard filter options (available game types, venues, etc.)
   */
  async getFilterOptions(): Promise<{
    gameTypes: Array<{ id: string, name: string }>;
    venues: Array<{ id: string, name: string, location: string }>;
  }> {
    try {
      analyticsService.trackEvent('leaderboard_filter_options_fetch_initiated');

      const response = await axios.get(`${API_BASE_URL}/api/leaderboard/filter-options`);
      
      analyticsService.trackEvent('leaderboard_filter_options_fetch_success');

      return response.data;
    } catch (error) {
      analyticsService.trackEvent('leaderboard_filter_options_fetch_error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Error fetching leaderboard filter options:', error);
      
      // Return empty data on error
      return {
        gameTypes: [],
        venues: []
      };
    }
  }
}

// Types for the User Stats data
export interface UserStatsData {
  globalRank: number;
  totalScore: number;
  recentScore: number; // Score earned in the last 7 days
  winRate: number;
  wins: number;
  losses: number;
  totalGames: number;
  longestWinStreak: number;
  currentWinStreak: number;
  favoriteVenue?: {
    id: string;
    name: string;
    gamesPlayed: number;
    rank: number;
  };
  recentTournaments: Array<{
    id: string;
    name: string;
    rank: number;
    totalPlayers: number;
    date: string;
  }>;
  skillLevel: number; // 0 to 100
  skillTier: string; // e.g., "Beginner", "Intermediate", "Master"
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    dateEarned: string;
    icon?: string;
  }>;
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService; 