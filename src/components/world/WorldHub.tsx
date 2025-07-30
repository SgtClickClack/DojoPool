import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { DojoService, DojoCandidate } from '../../services/DojoService';
import { OnboardingService } from '../../services/OnboardingService';
import { livingWorldHubService, PlayerData } from '../../services/LivingWorldHubService';
import LoadingOverlay from './LoadingOverlay';
import ErrorOverlay from './ErrorOverlay';
import PlayerHUD from './PlayerHUD';

interface WorldHubProps {
  className?: string;
}

const WorldHub: React.FC<WorldHubProps> = ({ className = '' }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [nearbyDojos, setNearbyDojos] = useState<DojoCandidate[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<DojoCandidate | null>(null);
  const [showDojoPanel, setShowDojoPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMapLegend, setShowMapLegend] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const worldHubService = useRef(livingWorldHubService);

  useEffect(() => {
    initializeWorldHub();
  }, []);

  useEffect(() => {
    if (mapRef.current && !map) {
      initializeMap();
    }
  }, [mapRef.current]);

  useEffect(() => {
    if (map && nearbyDojos.length > 0) {
      addMarkersToMap();
    }
  }, [map, nearbyDojos]);

  const initializeWorldHub = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has completed onboarding
      if (!OnboardingService.isOnboardingComplete()) {
        router.push('/onboarding/choose-dojo');
        return;
      }

      // Initialize the Living World Hub service
      await worldHubService.current.initializeSocket();
      
      // Fetch player data from the service
      const playerDataResult = await worldHubService.current.getPlayerData();
      setPlayerData(playerDataResult);
      
      // Get nearby dojos
      const location = OnboardingService.getOnboardingState().location;
      if (location) {
        const dojos = await DojoService.getCandidates(
          location.latitude,
          location.longitude,
          10000
        );
        setNearbyDojos(dojos);
      }
      
    } catch (error) {
      console.error('Error initializing WorldHub:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Dojo World');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    const defaultLocation = { lat: -27.4568, lng: 153.0364 }; // Fortitude Valley

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 14,
      styles: getAnimeMapStyle(),
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      }
    });

    setMap(mapInstance);
  };

  const getAnimeMapStyle = () => {
    return [
      {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#a2daf2' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  };

  const addMarkersToMap = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    nearbyDojos.forEach(dojo => {
      const marker = new google.maps.Marker({
        position: { lat: dojo.latitude, lng: dojo.longitude },
        map: map,
        title: dojo.name,
        icon: {
          url: getDojoMarkerIcon(dojo),
          scaledSize: new google.maps.Size(40, 40)
        }
      });

      marker.addListener('click', () => {
        setSelectedDojo(dojo);
        setShowDojoPanel(true);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  };

  const getDojoMarkerIcon = (dojo: DojoCandidate): string => {
    // Priority 1: Clan ownership determines marker color
    if (dojo.controllingClanId) {
      if (playerData && dojo.controllingClanId === playerData.clan) {
        return '/images/markers/friendly-dojo-marker.svg'; // Cyan marker for player's clan
      } else {
        return '/images/markers/rival-dojo-marker.svg'; // Red marker for other clans
      }
    } else {
      // Neutral territory (no controlling clan)
      return '/images/markers/neutral-dojo-marker.svg'; // Grey marker
    }
    
    // Fallback to original logic if clan data is not available
    if (playerData && dojo.name === playerData.homeDojo) {
      return '/images/markers/home-dojo-marker.svg'; // Blue marker
    }
    
    switch (dojo.status) {
      case 'verified':
        return '/images/markers/verified-dojo-marker.svg'; // Green marker
      case 'unconfirmed':
        return '/images/markers/unconfirmed-dojo-marker.svg'; // Gray marker
      case 'pending_verification':
        return '/images/markers/pending-dojo-marker.svg'; // Yellow marker
      default:
        return '/images/markers/default-dojo-marker.svg';
    }
  };

  const handleDojoPanelClose = () => {
    setShowDojoPanel(false);
    setSelectedDojo(null);
  };

  const handleChallengeDojo = () => {
    if (selectedDojo) {
      // Navigate to challenge page or open challenge modal
      router.push(`/challenge/${selectedDojo.id}`);
    }
  };

  const handleVisitDojo = () => {
    if (selectedDojo) {
      // Navigate to dojo details page
      router.push(`/dojo/${selectedDojo.id}`);
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <ErrorOverlay message={error} onRetry={initializeWorldHub} />
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <ErrorOverlay message="Player data not available" onRetry={initializeWorldHub} />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 ${className}`}>
      {/* Top-Right Corner UI */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-4">
        <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2 text-white">
          <span className="text-yellow-400">💰</span> {playerData.dojoCoins.toLocaleString()}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="bg-black bg-opacity-50 rounded-lg p-2 text-white hover:bg-opacity-70 transition-all"
        >
          ⚙️
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowMapLegend(!showMapLegend)}
          className="bg-black bg-opacity-50 rounded-lg p-2 text-white hover:bg-opacity-70 transition-all"
        >
          🗺️
        </button>
        
        {showMapLegend && (
          <div className="absolute top-12 left-0 bg-black bg-opacity-75 rounded-lg p-4 text-white text-sm min-w-48">
            <h3 className="font-semibold mb-2">Map Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🔵</span>
                <span>Your Dojo / Clan</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-red-400">🔴</span>
                <span>Rival Dojo</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">🟢</span>
                <span>Ally Dojo</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">⚪</span>
                <span>Unclaimed Dojo</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⭐</span>
                <span>Dojo Master Location</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player HUD */}
      <PlayerHUD playerData={playerData} />

      {/* Main Map */}
      <div 
        ref={mapRef}
        className="w-full h-screen"
      />

      {/* Dojo Profile Panel */}
      {showDojoPanel && selectedDojo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedDojo.name}</h2>
              <button
                onClick={handleDojoPanelClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">{selectedDojo.address}</p>
                <p className="text-sm text-gray-500">{selectedDojo.distance}m away</p>
              </div>
              
              {/* Clan Ownership Status */}
              <div className="border-t pt-3">
                {selectedDojo.controllingClan ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Controlled by:</span>
                    <span className="text-sm font-semibold text-red-600">{selectedDojo.controllingClan.name}</span>
                    {selectedDojo.controllingClan.tag && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {selectedDojo.controllingClan.tag}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Unclaimed Territory</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Available
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleVisitDojo}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Visit Dojo
                </button>
                <button
                  onClick={handleChallengeDojo}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  OnboardingService.resetOnboarding();
                  router.push('/onboarding/choose-dojo');
                }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Change Home Dojo
              </button>
              
              <button
                onClick={() => router.push('/avatar-progression')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Avatar Progression
              </button>
              
              <button
                onClick={() => router.push('/tournaments')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Tournaments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldHub; 