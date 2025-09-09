'use client';

import { MAPBOX_CONFIG, getMapboxToken } from '@/config/mapbox';
import { useAuth } from '@/hooks/useAuth';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { apiClient } from '@/services/APIService';
import { TerritoryData } from '@/types';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useCallback, useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import styles from './TacticalMap.module.css';

interface TacticalMapProps {
  height?: string | number;
}

interface TerritoryPopupData {
  territory: TerritoryData;
  isOwnedByUser: boolean;
  isOwnedByClan: boolean;
  canClaim: boolean;
  canChallenge: boolean;
}

const TacticalMap: React.FC<TacticalMapProps> = ({ height = '100%' }) => {
  const { metrics } = usePerformanceOptimization('TacticalMap', {
    enableLogging: process.env.NODE_ENV === 'development',
    logThreshold: 50,
  });

  const { user } = useAuth();
  const [territories, setTerritories] = useState<TerritoryData[]>([]);
  const [selectedTerritory, setSelectedTerritory] =
    useState<TerritoryPopupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapboxToken = getMapboxToken();

  // Fetch territory data
  const fetchTerritories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/v1/territories/map');
      setTerritories(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch territories:', err);
      setError('Failed to load territory data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerritories();
  }, [fetchTerritories]);

  // Handle territory claim
  const handleClaimTerritory = useCallback(
    async (territoryId: string) => {
      try {
        await apiClient.post(`/v1/territories/claim`, {
          territoryId,
          playerId: user?.id,
        });
        // Refresh territories after successful claim
        await fetchTerritories();
        setSelectedTerritory(null);
      } catch (err: any) {
        console.error('Failed to claim territory:', err);
        setError('Failed to claim territory');
      }
    },
    [user?.id, fetchTerritories]
  );

  // Handle territory challenge
  const handleChallengeTerritory = useCallback(
    async (territoryId: string) => {
      try {
        await apiClient.post(`/v1/territories/challenge`, {
          territoryId,
          challengerId: user?.id,
        });
        // Refresh territories after successful challenge
        await fetchTerritories();
        setSelectedTerritory(null);
      } catch (err: any) {
        console.error('Failed to challenge territory:', err);
        setError('Failed to challenge territory');
      }
    },
    [user?.id, fetchTerritories]
  );

  // Handle territory scout
  const handleScoutTerritory = useCallback(
    async (territoryId: string) => {
      try {
        await apiClient.post(`/v1/territories/${territoryId}/scout`, {
          playerId: user?.id,
        });
        // Refresh territories after successful scout
        await fetchTerritories();
        setSelectedTerritory(null);
      } catch (err: any) {
        console.error('Failed to scout territory:', err);
        setError('Failed to scout territory');
      }
    },
    [user?.id, fetchTerritories]
  );

  // Get marker color based on territory status
  const getMarkerColor = useCallback(
    (territory: TerritoryData) => {
      if (!territory.owner && !territory.clan) {
        return '#00ff9d'; // Green for unclaimed
      }
      if (territory.owner?.id === user?.id) {
        return '#00a8ff'; // Blue for owned by user
      }
      if (territory.clan?.id === (user as any)?.clanId) {
        return '#ff6b6b'; // Red for owned by user's clan
      }
      return '#ffaa00'; // Orange for contested/owned by others
    },
    [user]
  );

  // Handle marker click
  const handleMarkerClick = useCallback(
    (territory: TerritoryData) => {
      const isOwnedByUser = territory.owner?.id === user?.id;
      const isOwnedByClan = territory.clan?.id === (user as any)?.clanId;
      const canClaim = !territory.owner && !territory.clan;
      const canChallenge =
        !isOwnedByUser && !isOwnedByClan && (territory.owner || territory.clan);

      setSelectedTerritory({
        territory,
        isOwnedByUser,
        isOwnedByClan,
        canClaim,
        canChallenge,
      });
    },
    [user]
  );

  if (!mapboxToken) {
    return (
      <Paper
        sx={{
          p: 3,
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(26, 26, 46, 0.9)',
          border: '2px solid #ff6b6b',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2 }}>
            Mapbox Token Required
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
            Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer} data-height={height}>
        <Typography variant="h6" sx={{ color: '#ccc' }}>
          Loading Tactical Map...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer} data-height={height}>
        <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="outlined"
          onClick={fetchTerritories}
          sx={{ color: '#00ff9d', borderColor: '#00ff9d' }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className={styles.mapContainer}
      data-height={height}
      data-cy="tactical-map-container"
    >
      <Map
        {...MAPBOX_CONFIG.defaultCenter}
        style={{ width: '100%', height }}
        mapStyle={MAPBOX_CONFIG.defaultStyle}
        mapboxAccessToken={mapboxToken}
        onError={(e) => console.error('Map error:', e)}
      >
        {territories.map((territory) => (
          <Marker
            key={territory.id}
            longitude={territory.coordinates?.lng || 0}
            latitude={territory.coordinates?.lat || 0}
            onClick={() => handleMarkerClick(territory)}
          >
            <div
              className={`${styles.territoryMarker} ${
                territory.level > 1 ? styles.upgradedTerritory : ''
              }`}
              style={{ backgroundColor: getMarkerColor(territory) }}
              data-cy={`territory-marker${
                territory.status === 'UNCLAIMED'
                  ? '-unclaimed'
                  : territory.status === 'CLAIMED'
                    ? '-claimed'
                    : territory.status === 'CONTESTED'
                      ? '-contested'
                      : ''
              }${territory.clan ? '-clan-owned' : ''}`}
            >
              {territory.level > 1 && (
                <span
                  className={styles.territoryLevel}
                  data-cy="territory-level-indicator"
                >
                  {territory.level}
                </span>
              )}
            </div>
          </Marker>
        ))}

        {selectedTerritory && (
          <Popup
            longitude={selectedTerritory.territory.coordinates?.lng || 0}
            latitude={selectedTerritory.territory.coordinates?.lat || 0}
            onClose={() => setSelectedTerritory(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
          >
            <div className={styles.territoryPopup} data-cy="territory-popup">
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                {selectedTerritory.territory.name}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Chip
                  label={
                    selectedTerritory.territory.owner
                      ? `Owned by ${selectedTerritory.territory.owner.username}`
                      : selectedTerritory.territory.clan
                        ? `Clan: ${selectedTerritory.territory.clan.name}`
                        : 'Unclaimed'
                  }
                  size="small"
                  sx={{
                    backgroundColor:
                      selectedTerritory.isOwnedByUser ||
                      selectedTerritory.isOwnedByClan
                        ? '#00ff9d'
                        : selectedTerritory.territory.owner ||
                            selectedTerritory.territory.clan
                          ? '#ffaa00'
                          : '#666',
                    color: '#000',
                    mb: 1,
                  }}
                />
                {selectedTerritory.territory.clan && (
                  <div data-cy="territory-clan-info">
                    <Typography variant="caption" data-cy="territory-clan-name">
                      {selectedTerritory.territory.clan.name}
                    </Typography>
                    <Typography variant="caption" data-cy="territory-clan-tag">
                      [{selectedTerritory.territory.clan.tag}]
                    </Typography>
                  </div>
                )}
              </Box>

              {selectedTerritory.territory.status === 'CONTESTED' && (
                <Box sx={{ mb: 2 }} data-cy="territory-contest-info">
                  <Typography variant="caption" sx={{ color: '#ffaa00' }}>
                    Contested by{' '}
                    {selectedTerritory.territory.contestedBy?.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    data-cy="territory-contest-deadline"
                  >
                    Deadline:{' '}
                    {selectedTerritory.territory.contestDeadline
                      ? new Date(
                          selectedTerritory.territory.contestDeadline
                        ).toLocaleString()
                      : 'N/A'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedTerritory.canClaim && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                      handleClaimTerritory(selectedTerritory.territory.id)
                    }
                    sx={{
                      backgroundColor: '#00ff9d',
                      color: '#000',
                      '&:hover': { backgroundColor: '#00cc7a' },
                    }}
                    data-cy="claim-territory-btn"
                  >
                    Claim
                  </Button>
                )}

                {selectedTerritory.canChallenge && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                      handleChallengeTerritory(selectedTerritory.territory.id)
                    }
                    sx={{
                      backgroundColor: '#ff6b6b',
                      color: '#fff',
                      '&:hover': { backgroundColor: '#cc5555' },
                    }}
                    data-cy="challenge-territory-btn"
                  >
                    Challenge
                  </Button>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    handleScoutTerritory(selectedTerritory.territory.id)
                  }
                  sx={{
                    borderColor: '#00a8ff',
                    color: '#00a8ff',
                    '&:hover': { borderColor: '#0088cc', color: '#0088cc' },
                  }}
                  data-cy="scout-territory-btn"
                >
                  Scout
                </Button>
              </Box>

              {selectedTerritory.territory.defenseScore > 0 && (
                <Typography
                  variant="caption"
                  sx={{ color: '#ccc', mt: 1, display: 'block' }}
                >
                  Defense: {selectedTerritory.territory.defenseScore}
                </Typography>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default TacticalMap;
