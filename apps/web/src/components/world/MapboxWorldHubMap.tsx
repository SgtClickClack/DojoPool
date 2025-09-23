'use client';

import {
  type DojoData,
  type PlayerData,
  dojoService,
} from '@/services/dojoService';
import {
  getMapboxToken,
  handleMapboxError,
  MAPBOX_PERFORMANCE_CONFIG,
} from '@/config/mapbox';
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';

// Dynamically import maplibre-gl to reduce initial bundle size
let mapboxgl: any;
if (typeof window !== 'undefined') {
  import('maplibre-gl').then((mod) => {
    mapboxgl = mod.default;
    // CSS will be imported in the component when needed
  });
}

// Type declaration for mapboxgl
interface MapboxMap {
  // Add basic map interface properties
  [key: string]: any;
}
import styles from './MapboxWorldHubMap.module.css';

interface MapboxWorldHubMapProps {
  height?: string | number;
}

const MapboxWorldHubMap: React.FC<MapboxWorldHubMapProps> = memo(
  ({ height = '100%' }) => {
    // Utility function to generate height class
    const getHeightClass = (heightValue: string | number) => {
      if (typeof heightValue === 'string') {
        if (heightValue === '100%') return 'h100';
        if (heightValue === '100vh') return 'h100vh';
        // Extract numeric value from strings like "200px"
        const match = heightValue.match(/(\d+)px/);
        if (match) {
          const num = parseInt(match[1]);
          if (num <= 900) return `h${Math.floor(num / 100) * 100}`;
        }
      } else if (typeof heightValue === 'number') {
        if (heightValue <= 900)
          return `h${Math.floor(heightValue / 100) * 100}`;
      }
      return 'h100'; // default fallback
    };

    const heightClass = getHeightClass(height);
    const [dojos, setDojos] = useState<DojoData[]>([]);
    const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
    const [_playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState<
      'dark' | 'light' | 'vintage'
    >('dark');
    const [_mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const mapContainer = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
      try {
        setIsLoading(true);

        // Fetch player data to get clan information
        const player = await dojoService.getPlayerData();
        setPlayerData(player);

        // Fetch dojos in the Brisbane area
        const dojosData = await dojoService.getNearbyDojos(
          -27.4698, // Brisbane center
          153.0251,
          10000
        );
        setDojos(dojosData);
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // Initialize Mapbox map with performance optimizations
    useEffect(() => {
      if (!mapContainer.current) return;

      const token = getMapboxToken();
      if (!token) {
        setMapError('Mapbox token not found or invalid');
        return;
      }

      // maplibre-gl doesn't require accessToken, but we'll keep it for compatibility

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapboxTheme(selectedTheme),
        center: [153.0251, -27.4698], // [lng, lat] for Mapbox
        zoom: 13,
        attributionControl: false,
        // Performance optimizations
        ...MAPBOX_PERFORMANCE_CONFIG,
        // Additional performance settings
        maxTileCacheSize: MAPBOX_PERFORMANCE_CONFIG.maxTileCacheSize,
        renderWorldCopies: MAPBOX_PERFORMANCE_CONFIG.renderWorldCopies,
      });

      // Add error handling
      map.on('error', (e: any) => {
        handleMapboxError(e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });

      map.on('load', () => {
        setMapInstance(map);
        setMapError(null); // Clear any previous errors

        // Add dojo markers
        dojos.forEach((dojo) => {
          const el = document.createElement('div');
          el.className = 'dojo-marker';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.borderRadius = '50%';
          el.style.cursor = 'pointer';

          // Set marker color based on dojo status
          if (dojo.isLocked) {
            el.style.backgroundColor = '#e74c3c';
          } else if (dojo.controllingClanId) {
            el.style.backgroundColor = '#f39c12';
          } else {
            el.style.backgroundColor = '#27ae60';
          }

          // Add marker to map
          new mapboxgl.Marker(el)
            .setLngLat([dojo.coordinates.lng, dojo.coordinates.lat])
            .addTo(map);

          // Add click event
          el.addEventListener('click', () => handleMarkerClick(dojo));
        });
      });

      map.on('error', (e: any) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map');
      });

      return () => {
        if (map) {
          map.remove();
        }
      };
    }, [dojos, selectedTheme]);

    const handleMarkerClick = (dojo: DojoData) => {
      setSelectedDojo(dojo);
    };

    const handleCloseInfoWindow = () => {
      setSelectedDojo(null);
    };

    const getMapboxTheme = (theme: string) => {
      switch (theme) {
        case 'dark':
          return 'mapbox://styles/mapbox/dark-v11';
        case 'light':
          return 'mapbox://styles/mapbox/light-v11';
        case 'vintage':
          return 'mapbox://styles/mapbox/streets-v12';
        default:
          return 'mapbox://styles/mapbox/dark-v11';
      }
    };

    if (isLoading) {
      return (
        <div className={`${styles.loadingContainer} ${styles[heightClass]}`}>
          <div className={styles.centerContent}>
            <div className={styles.icon}>🌍</div>
            <p>Loading DojoPool World Map...</p>
          </div>
        </div>
      );
    }

    if (mapError) {
      return (
        <div className={`${styles.errorContainer} ${styles[heightClass]}`}>
          <div className={styles.centerContent}>
            <div className={styles.icon}>❌</div>
            <p>Map Error: {mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className={styles.retryButton}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`${styles.mapContainer} ${styles[heightClass]}`}>
        {/* Theme Selector */}
        <div className={styles.themeSelector}>
          <select
            value={selectedTheme}
            onChange={(e) =>
              setSelectedTheme(e.target.value as 'dark' | 'light' | 'vintage')
            }
            aria-label="Select map theme"
            title="Choose map theme"
            className={styles.themeSelect}
          >
            <option value="dark">🌙 Dark</option>
            <option value="light">☀️ Light</option>
            <option value="vintage">🎨 Vintage</option>
          </select>
        </div>

        {/* Map Container */}
        <div ref={mapContainer} className={styles.mapElement} />

        {/* Dojo List Overlay */}
        <div className={styles.dojoListOverlay}>
          <h3 className={styles.dojoListTitle}>
            🎯 Nearby Dojos ({dojos.length})
          </h3>
          <div className={styles.dojoGrid}>
            {dojos.map((dojo) => (
              <div
                key={dojo.id}
                onClick={() => handleMarkerClick(dojo)}
                className={`${styles.dojoItem} ${
                  selectedDojo?.id === dojo.id ? styles.selected : ''
                }`}
              >
                <div className={styles.dojoItemHeader}>
                  <span className={styles.dojoName}>{dojo.name}</span>
                  <span className={styles.dojoDistance}>{dojo.distance}</span>
                </div>
                {dojo.controllingClan && (
                  <div className={styles.dojoController}>
                    🏰 {dojo.controllingClan.name}
                  </div>
                )}
                {dojo.isLocked && (
                  <div className={styles.dojoLocked}>🔒 Locked</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Window */}
        {selectedDojo && (
          <div className={styles.infoWindow}>
            <div className={styles.infoWindowHeader}>
              <h3 className={styles.infoWindowTitle}>{selectedDojo.name}</h3>
              <button
                onClick={handleCloseInfoWindow}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div className={styles.infoWindowContent}>
              <p className={styles.infoWindowText}>
                📍 {selectedDojo.distance} away
              </p>
              {selectedDojo.controllingClan && (
                <p className={styles.infoWindowController}>
                  🏰 Controlled by {selectedDojo.controllingClan.name}
                </p>
              )}
              {selectedDojo.isLocked && (
                <p className={styles.infoWindowLocked}>
                  🔒 This dojo is currently locked
                </p>
              )}
            </div>

            <div className={styles.buttonContainer}>
              <button className={styles.challengeButton}>🎯 Challenge</button>
              <button className={styles.navigateButton}>📍 Navigate</button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MapboxWorldHubMap.displayName = 'MapboxWorldHubMap';

export default MapboxWorldHubMap;
