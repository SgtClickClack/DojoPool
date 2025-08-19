// LivingWorldHubService - Simplified version for MapView component

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
}

export interface PlayerData {
  id: string;
  name: string;
  clan?: string;
  avatar?: string;
}

// Mock data for development
const mockDojos: DojoData[] = [
  {
    id: '1',
    name: 'The Jade Tiger',
    coordinates: { lat: -27.4698, lng: 153.0251 },
    clan: 'Crimson Monkey Clan',
    distance: '0.2 km',
    controllingClan: {
      name: 'Crimson Monkey Clan',
      tag: 'CMC',
      avatar: '/avatars/crimson-monkey.png',
    },
    controllingClanId: 'crimson-monkey',
    isLocked: false,
  },
  {
    id: '2',
    name: 'Pool Paradise',
    coordinates: { lat: -27.47, lng: 153.0255 },
    clan: 'Unclaimed',
    distance: '0.5 km',
    isLocked: false,
  },
  {
    id: '3',
    name: 'Billiards & Brews',
    coordinates: { lat: -27.4695, lng: 153.0248 },
    clan: 'Azure Dragon Clan',
    distance: '0.8 km',
    controllingClan: {
      name: 'Azure Dragon Clan',
      tag: 'ADC',
      avatar: '/avatars/azure-dragon.png',
    },
    controllingClanId: 'azure-dragon',
    isLocked: true,
  },
];

const mockPlayer: PlayerData = {
  id: 'player-1',
  name: 'Player',
  clan: 'crimson-monkey',
  avatar: '/avatars/player.png',
};

class LivingWorldHubService {
  async getPlayerData(): Promise<PlayerData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockPlayer;
  }

  async getDojos(
    lat: number,
    lng: number,
    radius: number
  ): Promise<DojoData[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Filter dojos within radius (simplified calculation)
    return mockDojos.filter((dojo) => {
      const distance =
        Math.sqrt(
          Math.pow(dojo.coordinates.lat - lat, 2) +
            Math.pow(dojo.coordinates.lng - lng, 2)
        ) * 111000; // Rough conversion to meters
      return distance <= radius;
    });
  }
}

export const livingWorldHubService = new LivingWorldHubService();
