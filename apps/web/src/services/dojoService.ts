import { apiClient } from './apiClient';

export interface DojoData {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  controllingClanId?: string;
  controllingClan?: {
    name: string;
    tag?: string;
    avatar?: string;
  };
  isLocked?: boolean;
  clan?: string;
  distance?: string;
  clanLeader?: string;
  status: 'active' | 'inactive' | 'maintenance';
  owner?: string;
  createdAt?: string;
}

export interface PlayerData {
  id: string;
  name: string;
  clan?: string;
  avatar?: string;
}

class DojoService {
  async getDojos(
    lat: number,
    lng: number,
    radius: number = 10000
  ): Promise<DojoData[]> {
    try {
      const response = await apiClient.get(`/dojos/nearby`, {
        params: { lat, lng, radius },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dojos:', error);
      // Return mock data for development
      return this.getMockDojos(lat, lng);
    }
  }

  async getPlayerData(): Promise<PlayerData | null> {
    try {
      const response = await apiClient.get('/players/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching player data:', error);
      return null;
    }
  }

  private getMockDojos(centerLat: number, centerLng: number): DojoData[] {
    // Generate mock dojos around the center point for development
    const mockDojos: DojoData[] = [
      {
        id: '1',
        name: 'The Jade Tiger',
        coordinates: { lat: centerLat + 0.01, lng: centerLng + 0.01 },
        controllingClanId: 'crimson-monkey',
        controllingClan: { name: 'Crimson Monkey', tag: 'CM', avatar: '🐒' },
        isLocked: false,
        status: 'active',
        distance: '0.5km',
      },
      {
        id: '2',
        name: 'Pool Paradise',
        coordinates: { lat: centerLat - 0.008, lng: centerLng + 0.005 },
        controllingClanId: undefined,
        controllingClan: undefined,
        isLocked: false,
        status: 'active',
        distance: '0.8km',
      },
      {
        id: '3',
        name: 'Billiards & Brews',
        coordinates: { lat: centerLat + 0.005, lng: centerLng - 0.012 },
        controllingClanId: 'shadow-fox',
        controllingClan: { name: 'Shadow Fox', tag: 'SF', avatar: '🦊' },
        isLocked: true,
        status: 'active',
        distance: '1.2km',
      },
      {
        id: '4',
        name: 'Cue Corner',
        coordinates: { lat: centerLat - 0.015, lng: centerLng - 0.008 },
        controllingClanId: undefined,
        controllingClan: undefined,
        isLocked: false,
        status: 'active',
        distance: '1.5km',
      },
      {
        id: '5',
        name: 'Break & Run',
        coordinates: { lat: centerLat + 0.018, lng: centerLng - 0.005 },
        controllingClanId: 'thunder-dragon',
        controllingClan: { name: 'Thunder Dragon', tag: 'TD', avatar: '🐉' },
        isLocked: false,
        status: 'active',
        distance: '1.8km',
      },
    ];

    return mockDojos;
  }
}

export const dojoService = new DojoService();
export default dojoService;
