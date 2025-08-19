import { useEffect, useState } from 'react';
import { apiService } from '../services/ApiService';
import {
  ActiveMatch,
  DojoMapPin,
  DojoVenue,
  PlayerMapPin,
  TerritoryControl,
} from '../types/map';

interface MapData {
  players: PlayerMapPin[];
  dojos: DojoMapPin[];
  dojoVenues: DojoVenue[];
  activeMatches: ActiveMatch[];
  territories: TerritoryControl[];
  isLoading: boolean;
  error: string | null;
}

// Mock data for development - replace with actual API calls later
const initialPlayers: PlayerMapPin[] = [
  {
    id: '1',
    username: 'RyuKlaw',
    avatarUrl: 'https://via.placeholder.com/40x40/ff6b6b/ffffff?text=RK',
    coordinates: [153.0251, -27.4698], // Brisbane
    status: 'online',
    clan: 'Crimson Monkey',
    level: 42,
  },
  {
    id: '2',
    username: 'PoolMaster',
    avatarUrl: 'https://via.placeholder.com/40x40/4ecdc4/ffffff?text=PM',
    coordinates: [153.0231, -27.4718], // Near Brisbane
    status: 'in-match',
    clan: 'Golden Dragon',
    level: 38,
  },
  {
    id: '3',
    username: 'CueArtist',
    avatarUrl: 'https://via.placeholder.com/40x40/45b7d1/ffffff?text=CA',
    coordinates: [153.0271, -27.4678], // North of Brisbane
    status: 'online',
    clan: 'Silver Serpent',
    level: 35,
  },
];

// Mock Dojo locations - key territory points (fallback data)
const mockDojos: DojoMapPin[] = [
  {
    id: 'dojo-1',
    name: 'The Jade Tiger',
    controllingClan: 'Crimson Monkey',
    clanLogoUrl: 'https://via.placeholder.com/60x60/ff6b6b/ffffff?text=CM',
    coordinates: [153.0251, -27.4698], // Brisbane CBD
    address: '123 Pool Street, Brisbane',
    level: 5,
    isActive: true,
    isControlled: true,
    controllingPlayerId: '1',
    controllingPlayerName: 'RyuKlaw',
    controllingPlayerAvatar:
      'https://via.placeholder.com/40x40/ff6b6b/ffffff?text=RK',
  },
  {
    id: 'dojo-2',
    name: 'Golden Cue Lounge',
    controllingClan: 'Golden Dragon',
    clanLogoUrl: 'https://via.placeholder.com/60x60/ffd93d/000000?text=GD',
    coordinates: [153.0231, -27.4718], // South Brisbane
    address: '456 Cue Avenue, Brisbane',
    level: 3,
    isActive: true,
    isControlled: true,
    controllingPlayerId: '2',
    controllingPlayerName: 'PoolMaster',
    controllingPlayerAvatar:
      'https://via.placeholder.com/40x40/4ecdc4/ffffff?text=PM',
  },
  {
    id: 'dojo-3',
    name: 'Silver Serpent Sanctum',
    controllingClan: 'Silver Serpent',
    clanLogoUrl: 'https://via.placeholder.com/60x60/45b7d1/ffffff?text=SS',
    coordinates: [153.0271, -27.4678], // Fortitude Valley
    address: '789 Serpent Way, Brisbane',
    level: 4,
    isActive: true,
    isControlled: false,
  },
];

const mockDojoVenues: DojoVenue[] = [
  {
    id: '1',
    name: 'The Jade Tiger',
    coordinates: [153.0251, -27.4698],
    address: '123 Pool Street, Brisbane',
    currentController: 'RyuKlaw',
    clan: 'Crimson Monkey',
    level: 5,
    isActive: true,
  },
  {
    id: '2',
    name: 'Golden Cue Lounge',
    coordinates: [153.0231, -27.4718],
    address: '456 Cue Avenue, Brisbane',
    currentController: 'PoolMaster',
    clan: 'Golden Dragon',
    level: 3,
    isActive: true,
  },
];

const mockActiveMatches: ActiveMatch[] = [
  {
    id: '1',
    player1: 'PoolMaster',
    player2: 'CueArtist',
    venue: 'Golden Cue Lounge',
    coordinates: [153.0231, -27.4718],
    status: 'in-progress',
    startTime: new Date().toISOString(),
    estimatedDuration: 1800, // 30 minutes
  },
];

const mockTerritories: TerritoryControl[] = [
  {
    id: '1',
    name: 'Brisbane Central',
    coordinates: [153.0251, -27.4698],
    controllingClan: 'Crimson Monkey',
    controlLevel: 5,
    lastContested: new Date().toISOString(),
    isUnderAttack: false,
  },
];

export const useMapData = (): MapData => {
  const [data, setData] = useState<MapData>({
    players: [],
    dojos: [],
    dojoVenues: [],
    activeMatches: [],
    territories: [],
    isLoading: true,
    error: null,
  });

  // Function to fetch real territory data
  const fetchTerritories = async () => {
    try {
      const territories = await apiService.getTerritories();
      const dojosWithTerritoryInfo: DojoMapPin[] = territories.map(
        (territory) => ({
          id: territory.id,
          name: territory.name,
          coordinates: territory.coordinates,
          address: 'Address TBD', // Will be updated when venue data is available
          level: territory.level,
          isActive: territory.isActive,
          isControlled: !!territory.controllingPlayerId,
          controllingPlayerId: territory.controllingPlayerId,
          controllingPlayerName: territory.controllingPlayerName,
          controllingPlayerAvatar: territory.controllingPlayerAvatar,
          clan: territory.clan,
          clanLogoUrl: territory.clan
            ? `https://via.placeholder.com/60x60/ff6b6b/ffffff?text=${territory.clan
                .substring(0, 2)
                .toUpperCase()}`
            : undefined,
        })
      );

      return dojosWithTerritoryInfo;
    } catch (error) {
      console.error('Failed to fetch territories, using mock data:', error);
      return mockDojos;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true }));

        // Fetch real territory data
        const territories = await fetchTerritories();

        setData({
          players: initialPlayers,
          dojos: territories,
          dojoVenues: mockDojoVenues,
          activeMatches: mockActiveMatches,
          territories: mockTerritories,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading map data:', error);
        setData({
          players: initialPlayers,
          dojos: mockDojos,
          dojoVenues: mockDojoVenues,
          activeMatches: mockActiveMatches,
          territories: mockTerritories,
          isLoading: false,
          error: 'Failed to load territory data',
        });
      }
    };

    loadData();
  }, []);

  // Simulate real-time player movement
  useEffect(() => {
    if (data.isLoading) return;

    const interval = setInterval(() => {
      setData((prevData) => ({
        ...prevData,
        players: prevData.players.map((player) => {
          // Generate small random movement (within ~100m radius)
          const longitudeOffset = (Math.random() - 0.5) * 0.001; // ~100m
          const latitudeOffset = (Math.random() - 0.5) * 0.001; // ~100m

          const newLongitude = player.coordinates[0] + longitudeOffset;
          const newLatitude = player.coordinates[1] + latitudeOffset;

          // Keep players within reasonable bounds around Brisbane
          const boundedLongitude = Math.max(
            152.9,
            Math.min(153.1, newLongitude)
          );
          const boundedLatitude = Math.max(-27.6, Math.min(-27.3, newLatitude));

          return {
            ...player,
            coordinates: [boundedLongitude, boundedLatitude],
          };
        }),
      }));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [data.isLoading]);

  // TODO: Replace mock data with actual API calls
  // const fetchMapData = async () => {
  //   try {
  //     setData(prev => ({ ...prev, isLoading: true }));
  //     const response = await fetch('/api/map/data');
  //     const mapData = await response.json();
  //     setData({
  //       ...mapData,
  //       isLoading: false,
  //       error: null
  //     });
  //   } catch (error) {
  //     setData(prev => ({
  //       ...prev,
  //       isLoading: false,
  //       error: error instanceof Error ? error.message : 'Failed to fetch map data'
  //     }));
  //   }
  // };

  return data;
};
