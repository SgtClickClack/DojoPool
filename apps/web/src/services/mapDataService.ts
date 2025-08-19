/**
 * Map Data Service for DojoPool
 * Loads and processes GeoJSON data for the World Hub Map
 */

import { getClanColor } from '../styles/dojopool-map-style';

// Import the GeoJSON data
import playersData from '../../data/dojopool-players.geojson';
import territoriesData from '../../data/dojopool-territories.geojson';
import venuesData from '../../data/dojopool-venues.geojson';

export interface ProcessedMapData {
  venues: any[];
  players: any[];
  territories: any[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Process GeoJSON data and add DojoPool-specific properties
 */
function processGeoJSONData() {
  try {
    // Process venues data
    const processedVenues = venuesData.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        clanColor: getClanColor(feature.properties.controllingClan),
        markerType: 'venue',
        size: 'large',
      },
    }));

    // Process players data
    const processedPlayers = playersData.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        clanColor: getClanColor(feature.properties.clan),
        markerType: 'player',
        size: 'medium',
      },
    }));

    // Process territories data
    const processedTerritories = territoriesData.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        clanColor: getClanColor(feature.properties.clan),
        markerType: 'territory',
        size: 'area',
      },
    }));

    return {
      venues: processedVenues,
      players: processedPlayers,
      territories: processedTerritories,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error('Error processing GeoJSON data:', error);
    return {
      venues: [],
      players: [],
      territories: [],
      isLoading: false,
      error: 'Failed to process map data',
    };
  }
}

/**
 * Get all processed map data
 */
export function getProcessedMapData(): ProcessedMapData {
  return processGeoJSONData();
}

/**
 * Get venues data
 */
export function getVenuesData() {
  return processGeoJSONData().venues;
}

/**
 * Get players data
 */
export function getPlayersData() {
  return processGeoJSONData().players;
}

/**
 * Get territories data
 */
export function getTerritoriesData() {
  return processGeoJSONData().territories;
}

/**
 * Get data for a specific clan
 */
export function getClanData(clanName: string) {
  const data = processGeoJSONData();

  return {
    venues: data.venues.filter(
      (venue) => venue.properties.controllingClan === clanName
    ),
    players: data.players.filter(
      (player) => player.properties.clan === clanName
    ),
    territories: data.territories.filter(
      (territory) => territory.properties.clan === clanName
    ),
  };
}

/**
 * Get data for a specific dojo
 */
export function getDojoData(dojoId: string) {
  const data = processGeoJSONData();

  const venue = data.venues.find((v) => v.properties.id === dojoId);
  if (!venue) return null;

  const clan = venue.properties.controllingClan;
  const clanData = getClanData(clan);

  return {
    venue,
    clanData,
    nearbyPlayers: data.players.filter((player) => {
      // Simple distance calculation (in production, use proper geo calculations)
      const playerCoords = player.geometry.coordinates;
      const venueCoords = venue.geometry.coordinates;
      const distance = Math.sqrt(
        Math.pow(playerCoords[0] - venueCoords[0], 2) +
          Math.pow(playerCoords[1] - venueCoords[1], 2)
      );
      return distance < 0.01; // Roughly 1km radius
    }),
  };
}

/**
 * Search data by name or clan
 */
export function searchMapData(query: string) {
  const data = processGeoJSONData();
  const lowerQuery = query.toLowerCase();

  const results = {
    venues: data.venues.filter(
      (venue) =>
        venue.properties.name.toLowerCase().includes(lowerQuery) ||
        venue.properties.controllingClan.toLowerCase().includes(lowerQuery)
    ),
    players: data.players.filter(
      (player) =>
        player.properties.username.toLowerCase().includes(lowerQuery) ||
        player.properties.clan.toLowerCase().includes(lowerQuery)
    ),
    territories: data.territories.filter(
      (territory) =>
        territory.properties.name.toLowerCase().includes(lowerQuery) ||
        territory.properties.clan.toLowerCase().includes(lowerQuery)
    ),
  };

  return results;
}

/**
 * Get map statistics
 */
export function getMapStatistics() {
  const data = processGeoJSONData();

  const clanStats = data.venues.reduce((acc, venue) => {
    const clan = venue.properties.controllingClan;
    if (!acc[clan]) {
      acc[clan] = { venues: 0, totalLevel: 0, players: 0 };
    }
    acc[clan].venues++;
    acc[clan].totalLevel += venue.properties.level;
    return acc;
  }, {} as Record<string, { venues: number; totalLevel: number; players: number }>);

  // Add player counts
  data.players.forEach((player) => {
    const clan = player.properties.clan;
    if (clanStats[clan]) {
      clanStats[clan].players++;
    }
  });

  return {
    totalVenues: data.venues.length,
    totalPlayers: data.players.length,
    totalTerritories: data.territories.length,
    clanStats,
    averageVenueLevel:
      data.venues.reduce((sum, v) => sum + v.properties.level, 0) /
      data.venues.length,
  };
}
