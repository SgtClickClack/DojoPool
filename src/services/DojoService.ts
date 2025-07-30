import { api } from './api';

export interface DojoCandidate {
  id: string;
  name: string;
  address: string;
  distance: number; // in meters
  status: 'verified' | 'unconfirmed' | 'pending_verification';
  photo?: string;
  placeId?: string;
  latitude: number;
  longitude: number;
  // Clan ownership fields
  controllingClanId?: string;
  controllingClan?: {
    id: string;
    name: string;
    tag: string;
    avatar?: string;
  };
}

export interface DojoNomination {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  contactInfo?: string;
}

export interface DojoLeaderboard {
  dojoId: string;
  players: Array<{
    id: string;
    name: string;
    avatar?: string;
    level: number;
    wins: number;
    losses: number;
    rank: number;
  }>;
}

export class DojoService {
  /**
   * Get nearby dojo candidates for onboarding
   */
  static async getCandidates(latitude: number, longitude: number, radius: number = 5000): Promise<DojoCandidate[]> {
    try {
      const response = await api.get('/api/dojo/candidates', {
        params: {
          lat: latitude,
          lng: longitude,
          radius
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dojo candidates:', error);
      throw error;
    }
  }

  /**
   * Nominate a new dojo
   */
  static async nominateDojo(nomination: DojoNomination): Promise<{ success: boolean; dojoId?: string; message: string }> {
    try {
      const response = await api.post('/api/dojo/nominate', nomination);
      return response.data;
    } catch (error) {
      console.error('Error nominating dojo:', error);
      throw error;
    }
  }

  /**
   * Set player's home dojo
   */
  static async setHomeDojo(dojoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/api/player/setHomeDojo', { dojoId });
      return response.data;
    } catch (error) {
      console.error('Error setting home dojo:', error);
      throw error;
    }
  }

  /**
   * Get dojo leaderboard
   */
  static async getLeaderboard(dojoId: string): Promise<DojoLeaderboard> {
    try {
      const response = await api.get(`/api/dojo/${dojoId}/leaderboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dojo leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get player's current home dojo
   */
  static async getHomeDojo(): Promise<DojoCandidate | null> {
    try {
      const response = await api.get('/api/player/homeDojo');
      return response.data;
    } catch (error) {
      console.error('Error fetching home dojo:', error);
      return null;
    }
  }

  /**
   * Get dojo details by ID
   */
  static async getDojoDetails(dojoId: string): Promise<DojoCandidate> {
    try {
      const response = await api.get(`/api/dojo/${dojoId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dojo details:', error);
      throw error;
    }
  }
} 