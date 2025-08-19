// Generated type definitions

function createDojoMarker(venue: any): any {
  // Implementation
}

function adjustColor(color: any, percent: any): any {
  // Implementation
}

function getVenueColor(venue: any): any {
  // Implementation
}

function getRankGradient(rank: any): any {
  // Implementation
}

function getStatusEffects(status: any): any {
  // Implementation
}

function getVenueAnimation(status: any): any {
  // Implementation
}

function createCircleMarker(color: string, scale: number = 8): any {
  // Implementation
}

function searchVenues(location: any): any {
  // Implementation
}

function handleLocationError(browserHasGeolocation: any, pos: any): any {
  // Implementation
}

function showError(message: any): any {
  // Implementation
}

function determineVenueRank(place: any): any {
  // Implementation
}

function createInfoWindowContent(place: any, nameLower: any): any {
  // Implementation
}

function checkVenueUnlock(venue: any, playerPosition: any): any {
  // Implementation
}

function checkVenueCapture(venue: any, playerPosition: any): any {
  // Implementation
}

function startVenueCapture(venue: any): any {
  // Implementation
}

function captureVenue(venue: any): any {
  // Implementation
}

function updatePlayerTerritory(venue: any): any {
  // Implementation
}

function updateTerritoryOverlay(): any {
  // Implementation
}

function generateTerritoryBoundary(territory: any): any {
  // Implementation
}

function getNearbyVenues(location: any, radius: any): any {
  // Implementation
}

function checkUnlockRequirements(venue: any, nearbyVenues: any): any {
  // Implementation
}

function getVenueMinLevel(venue: any): any {
  // Implementation
}

function getRequiredCaptures(venue: any): any {
  // Implementation
}

function getVenueInfluence(venue: any): any {
  // Implementation
}

function unlockVenue(venue: any): any {
  // Implementation
}

function updateMarkerAppearance(venue: any): any {
  // Implementation
}

function updateCaptureProgress(venue: any, timeSpent: any): any {
  // Implementation
}

function cancelVenueCapture(venue: any): any {
  // Implementation
}

function showUnlockAnimation(venue: any): any {
  // Implementation
}

function showCaptureProgress(venue: any, progress: any): any {
  // Implementation
}

function hideCaptureProgress(venue: any): any {
  // Implementation
}

function generateEvent(venue: any): any {
  // Implementation
}

function selectEventType(venue: any): any {
  // Implementation
}

function getEventDuration(rank: any): any {
  // Implementation
}

function generateEventRewards(rank: any): any {
  // Implementation
}

function generateEventRequirements(rank: any): any {
  // Implementation
}

function joinEvent(eventId: any): any {
  // Implementation
}

function checkEventRequirements(event: any): any {
  // Implementation
}

function updateEventDisplay(event: any): any {
  // Implementation
}

function generateEventIndicator(event: any): any {
  // Implementation
}

function completeEvent(event: any): any {
  // Implementation
}

function distributeRewards(event: any): any {
  // Implementation
}

function initializeTerritorySystem(): any {
  // Implementation
}

function createTerritory(venue: any): any {
  // Implementation
}

function updateTerritories(): any {
  // Implementation
}

function checkTerritoryConflict(territory1: any, territory2: any): any {
  // Implementation
}

function updateTerritoryVisualization(): any {
  // Implementation
}

function showTerritoryInfo(territory: any): any {
  // Implementation
}

function checkLevelUp(): any {
  // Implementation
}

function levelUp(): any {
  // Implementation
}

function updatePlayerRank(): any {
  // Implementation
}

function showLevelUpNotification(level: any, oldNextLevelXP: any): any {
  // Implementation
}

function getLevelUpRewards(level: any): any {
  // Implementation
}

function getNewTitle(level: any): any {
  // Implementation
}

function getSpecialItem(level: any): any {
  // Implementation
}

function checkAchievements(): any {
  // Implementation
}

function unlockAchievement(achievement: any): any {
  // Implementation
}

function getAchievementDetails(achievement: any): any {
  // Implementation
}

function grantAchievementReward(achievement: any): any {
  // Implementation
}

function getAchievementItem(achievement: any): any {
  // Implementation
}

class Territory {
  // Properties and methods
}

// Type imports

let map;
let playerMarker;
let service;
let markers = [];
let currentInfoWindow = null;

// Venue status and progression system
const VenueStatus: any = {
  LOCKED: 'locked',
  NEUTRAL: 'neutral',
  ALLY: 'ally',
  ENEMY: 'enemy',
  OWNED: 'owned',
};

// Venue ranks for progression
const VenueRank: any = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  MASTER: 'master',
};

// Add venue progression constants
const VenueProgression: any = {
  UNLOCK_RADIUS: 1000, // meters
  CAPTURE_RADIUS: 100, // meters
  MIN_VISIT_TIME: 300, // seconds (5 minutes)
  INFLUENCE_RADIUS: 2000, // meters
  TERRITORY_OVERLAP: 500, // meters
};

// Add player stats
const PlayerStats: any = {
  level: 1,
  experience: 0,
  influence: 0,
  capturedVenues: 0,
  territory: [],
  achievements: new Set(),
  titles: new Set(),
  rank: 'Novice',
  nextLevelXP: 1000,
};

// Player Progression System
const PlayerProgression: any = {
  LEVEL_XP_BASE: 1000,
  LEVEL_XP_MULTIPLIER: 1.5,
  MAX_LEVEL: 50,
};

const PlayerAchievements: any = {
  FIRST_CAPTURE: 'first_capture',
  TERRITORY_MASTER: 'territory_master',
  EVENT_WINNER: 'event_winner',
  VENUE_COLLECTOR: 'venue_collector',
  INFLUENCE_KING: 'influence_king',
};

// Custom map style for game aesthetic
const gameMapStyle: any = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4a90e2' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// Helper function to create dojo marker element
function createDojoMarker(venue: any): any {
  if (!venue) {
    console.warn('No venue data provided to createDojoMarker');
    venue = {
      status: VenueStatus.NEUTRAL,
      rank: VenueRank.BEGINNER,
      hasActiveEvent: false,
    };
  }

  const baseColor: any = getVenueColor(venue);
  const darker: any = adjustColor(baseColor, -30);
  const lighter: any = adjustColor(baseColor, 30);

  // Calculate unlock status effects
  const isLocked: any = venue.status === VenueStatus.LOCKED;
  const opacity: any = isLocked ? '0.5' : '1';
  const lockEffect: any = isLocked ? 'grayscale(1)' : 'none';

  const div: any = document.createElement('div');
  div.innerHTML = `
    <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Enhanced outer glow effect -->
        <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="0" result="offsetblur"/>
          <feFlood flood-color="${baseColor}" flood-opacity="0.8"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <!-- Inner glow effect -->
        <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
          <feComposite in2="SourceGraphic" operator="arithmetic" k2="-1" k3="1"/>
          <feFlood flood-color="${lighter}" flood-opacity="0.5"/>
          <feComposite operator="in" in2="SourceGraphic"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Black outline effect -->
        <filter id="outline" x="-50%" y="-50%" width="200%" height="200%">
          <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="thicken"/>
          <feFlood flood-color="black" result="outlineColor"/>
          <feComposite in="outlineColor" in2="thicken" operator="in" result="outline"/>
          <feMerge>
            <feMergeNode in="outline"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Rank indicator gradient -->
        <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          ${getRankGradient(venue.rank)}
        </linearGradient>

        <!-- Gradient for roofs -->
        <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${lighter}"/>
          <stop offset="100%" style="stop-color:${darker}"/>
        </linearGradient>

        <!-- Pattern for wood texture -->
        <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="${baseColor}"/>
          <rect width="1" height="4" fill="${darker}" opacity="0.3"/>
        </pattern>

        <!-- Status indicator gradient -->
        <linearGradient id="statusGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.2)"/>
          <stop offset="100%" style="stop-color:rgba(255,255,255,0.1)"/>
        </linearGradient>
      </defs>

      <!-- Ground shadow with glow -->
      <ellipse cx="25" cy="47" rx="15" ry="2" fill="rgba(0,0,0,0.3)" filter="url(#outerGlow)" style="opacity: ${opacity}"/>

      <!-- Main structure with outline, glows, and shadow -->
      <g filter="url(#outline)" style="opacity: ${opacity}; filter: ${lockEffect}">
        <g filter="url(#outerGlow)">
          <g filter="url(#innerGlow)">
            <!-- Base with outline -->
            <path d="M15 25 L35 25 L33 45 L17 45 Z" fill="url(#woodPattern)" stroke="black" stroke-width="1"/>
            
            <!-- Main roof layers with outline -->
            <path d="M10 25 L25 10 L40 25 L35 27 L15 27 Z" fill="url(#roofGradient)" stroke="black" stroke-width="1"/>
            <path d="M13 21 L25 12 L37 21 L34 23 L16 23 Z" fill="url(#roofGradient)" stroke="black" stroke-width="1"/>
            <path d="M16 17 L25 10 L34 17 L31 19 L19 19 Z" fill="url(#roofGradient)" stroke="black" stroke-width="1"/>
            
            <!-- Rest of the elements with outlines -->
            <path d="M24 8 L25 7 L26 8 L25 9 Z" fill="${lighter}" stroke="black" stroke-width="0.5"/>
            <path d="M24 11 L25 10 L26 11 L25 12 Z" fill="${lighter}" stroke="black" stroke-width="0.5"/>
            <path d="M24 14 L25 13 L26 14 L25 15 Z" fill="${lighter}" stroke="black" stroke-width="0.5"/>

            <!-- Pillars -->
            <rect x="17" y="27" width="2" height="18" fill="${darker}"/>
            <rect x="31" y="27" width="2" height="18" fill="${darker}"/>

            <!-- Windows with status indicator potential -->
            <path d="M21 30 L24 30 L24 35 L21 35 Z" fill="url(#statusGradient)"/>
            <path d="M26 30 L29 30 L29 35 L26 35 Z" fill="url(#statusGradient)"/>

            <!-- Entrance -->
            <path d="M22 36 L28 36 L27 45 L23 45 Z" fill="rgba(0,0,0,0.5)"/>
            
            <!-- Steps -->
            <rect x="21" y="43" width="8" height="1" fill="rgba(255,255,255,0.3)"/>
            <rect x="20" y="44" width="10" height="1" fill="rgba(255,255,255,0.2)"/>

            <!-- Status effects -->
            ${getStatusEffects(venue.status)}

            <!-- Lock indicator for locked venues -->
            ${
              isLocked
                ? `
              <g transform="translate(25,25)">
                <path d="M-5,-10 h10 v6 h-10z" fill="${darker}"/>
                <circle r="3" cy="-7" fill="none" stroke="${darker}" stroke-width="2"/>
              </g>
            `
                : ''
            }

            <!-- Active event indicator -->
            ${
              venue.hasActiveEvent
                ? `
              <circle cx="40" cy="10" r="3" fill="#FF5722">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
              </circle>
            `
                : ''
            }

            <!-- Rank indicator banner -->
            <path d="M10 25 L15 20 L35 20 L40 25" fill="url(#rankGradient)" stroke="${darker}" stroke-width="0.5"/>
          </g>
        </g>
      </g>
    </svg>
  `;

  // Enhanced animation styles
  div.style.animation = getVenueAnimation(venue.status);
  div.style.filter = `drop-shadow(0 0 10px ${baseColor}) drop-shadow(0 0 2px black)`;
  div.style.transform = 'scale(1.2)'; // Make markers 20% larger

  return div;
}

// Helper function to adjust color brightness
function adjustColor(color, percent) {
  const num: any = parseInt(color.replace('#', ''), 16);
  const r: any = (num >> 16) + percent;
  const g: any = ((num >> 8) & 0x00ff) + percent;
  const b: any = (num & 0x0000ff) + percent;

  return (
    '#' +
    (
      0x1000000 +
      (r < 255 ? (r < 1 ? 0 : r) : 255) * 0x10000 +
      (g < 255 ? (g < 1 ? 0 : g) : 255) * 0x100 +
      (b < 255 ? (b < 1 ? 0 : b) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// Helper function to get venue color based on status and type
function getVenueColor(venue: any): any {
  // Default color if no venue or status
  if (!venue || !venue.status) return '#808080';

  switch (venue.status) {
    case VenueStatus.LOCKED:
      return '#808080';
    case VenueStatus.NEUTRAL:
      return '#E0E0E0';
    case VenueStatus.ALLY:
      return '#2196F3';
    case VenueStatus.ENEMY:
      return '#F44336';
    case VenueStatus.OWNED:
      return '#4CAF50';
    default:
      return '#808080';
  }
}

// Helper function to get rank gradient
function getRankGradient(rank: any): any {
  switch (rank) {
    case VenueRank.BEGINNER:
      return '<stop offset="0%" style="stop-color:#4CAF50"/><stop offset="100%" style="stop-color:#81C784"/>';
    case VenueRank.INTERMEDIATE:
      return '<stop offset="0%" style="stop-color:#2196F3"/><stop offset="100%" style="stop-color:#64B5F6"/>';
    case VenueRank.ADVANCED:
      return '<stop offset="0%" style="stop-color:#9C27B0"/><stop offset="100%" style="stop-color:#BA68C8"/>';
    case VenueRank.MASTER:
      return '<stop offset="0%" style="stop-color:#FFC107"/><stop offset="100%" style="stop-color:#FFD54F"/>';
    default:
      return '<stop offset="0%" style="stop-color:#9E9E9E"/><stop offset="100%" style="stop-color:#E0E0E0"/>';
  }
}

// Helper function to get status-specific effects
function getStatusEffects(status: any): any {
  switch (status) {
    case VenueStatus.OWNED:
      return `<circle cx="25" cy="5" r="2" fill="#4CAF50">
                <animate attributeName="r" values="2;2.5;2" dur="2s" repeatCount="indefinite"/>
              </circle>`;
    case VenueStatus.ALLY:
      return `<circle cx="25" cy="5" r="2" fill="#2196F3">
                <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
              </circle>`;
    case VenueStatus.ENEMY:
      return `<circle cx="25" cy="5" r="2" fill="#F44336">
                <animate attributeName="transform" attributeType="XML"
                  type="rotate" from="0 25 5" to="360 25 5" dur="3s" repeatCount="indefinite"/>
              </circle>`;
    default:
      return `<circle cx="25" cy="5" r="2" fill="rgba(255,255,255,0.5)"/>`;
  }
}

// Helper function to get status-specific animations
function getVenueAnimation(status: any): any {
  switch (status) {
    case VenueStatus.LOCKED:
      return 'none';
    case VenueStatus.OWNED:
      return 'dojoFloat 3s ease-in-out infinite, dojoGlow 2s ease-in-out infinite';
    case VenueStatus.ALLY:
      return 'dojoFloat 3s ease-in-out infinite';
    case VenueStatus.ENEMY:
      return 'dojoShake 0.5s ease-in-out infinite';
    default:
      return 'dojoFloat 3s ease-in-out infinite';
  }
}

// Enhanced CSS animations
const style: any = document.createElement('style');
style.textContent = `
  @keyframes dojoFloat {
    0% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 10px rgba(255,255,255,0.5)); }
    50% { transform: translateY(-3px) scale(1.05); filter: drop-shadow(0 0 20px rgba(255,255,255,0.8)); }
    100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 10px rgba(255,255,255,0.5)); }
  }

  @keyframes dojoGlow {
    0% { filter: drop-shadow(0 0 15px rgba(76,175,80,0.7)); }
    50% { filter: drop-shadow(0 0 30px rgba(76,175,80,1)); }
    100% { filter: drop-shadow(0 0 15px rgba(76,175,80,0.7)); }
  }

  @keyframes dojoShake {
    0% { transform: translateX(0); filter: drop-shadow(0 0 15px rgba(244,67,54,0.7)); }
    25% { transform: translateX(-1px); filter: drop-shadow(0 0 25px rgba(244,67,54,0.8)); }
    75% { transform: translateX(1px); filter: drop-shadow(0 0 25px rgba(244,67,54,0.8)); }
    100% { transform: translateX(0); filter: drop-shadow(0 0 15px rgba(244,67,54,0.7)); }
  }
`;
document.head.appendChild(style);

// Initialize map when the API is loaded
window.initMap = function () {
  console.log('Initializing map...');
  try {
    const defaultCenter: any = { lat: 51.5074, lng: -0.1278 };
    console.log('Default center:', defaultCenter);

    const mapDiv: any = document.getElementById('venue-map');
    console.log('Map div:', mapDiv);

    if (!mapDiv) {
      console.log('Map container not found');
      return;
    }

    const mapOptions: any = {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      backgroundColor: '#1a1a1a',
      mapId: 'dojo_pool_map_id', // Use mapId for styling instead of styles property
    };

    map = new google.maps.Map(mapDiv, mapOptions);
    service = new google.maps.places.PlacesService(map);
    console.log('Map initialized successfully');

    // Try to get user's location
    if (navigator.geolocation) {
      console.log('Getting user location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('User location obtained:', position);
          const pos: any = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);

          // Create a marker for user's location using AdvancedMarkerElement
          const userMarkerView: any =
            new google.maps.marker.AdvancedMarkerElement({
              map,
              position: pos,
              title: 'Your Location',
              content: createCircleMarker('#2196F3', 10),
            });
          playerMarker = userMarkerView;

          // Search for venues
          searchVenues(pos);
        },
        (error) => {
          console.error('Geolocation error:', error);
          handleLocationError(true, map.getCenter());
          searchVenues(defaultCenter);
        }
      );
    } else {
      console.log('Geolocation not supported');
      handleLocationError(false, map.getCenter());
      searchVenues(defaultCenter);
    }
  } catch (error) {
    console.error('Error initializing map:', error);
    showError('Failed to initialize map: ' + error.message);
  }
};

// Make initMap globally available
window.initMap = initMap;

// Helper function to create circle marker element
function createCircleMarker(color: string, scale: number = 8): any {
  const div: any = document.createElement('div');
  div.style.width = `${scale * 2}px`;
  div.style.height = `${scale * 2}px`;
  div.style.borderRadius = '50%';
  div.style.background = color;
  div.style.border = '2px solid white';
  return div;
}

// Search for venues using Places API
function searchVenues(location: any): any {
  // First search for dedicated pool venues
  const poolRequest: any = {
    location: location,
    radius: 15000, // 15km radius
    keyword: 'pool table OR snooker OR billiards OR pool hall',
    type: 'establishment', // Single string instead of array
  };

  // Second search for bars and hotels
  const barHotelRequest: any = {
    location: location,
    radius: 15000,
    type: 'bar', // Single string instead of array
    keyword: 'pub OR hotel OR tavern',
  };

  // Third search specifically for hotels
  const hotelRequest: any = {
    location: location,
    radius: 15000,
    type: 'lodging', // Single string instead of array
    keyword: 'hotel OR tavern',
  };

  // Perform all searches
  service.nearbySearch(poolRequest, (poolResults, poolStatus) => {
    if (poolStatus !== google.maps.places.PlacesServiceStatus.OK) {
      console.warn('Pool venue search failed:', poolStatus);
    }

    service.nearbySearch(barHotelRequest, (barResults, barStatus) => {
      if (barStatus !== google.maps.places.PlacesServiceStatus.OK) {
        console.warn('Bar/hotel search failed:', barStatus);
      }

      service.nearbySearch(hotelRequest, (hotelResults, hotelStatus) => {
        if (hotelStatus !== google.maps.places.PlacesServiceStatus.OK) {
          console.warn('Hotel search failed:', hotelStatus);
        }

        // Clear existing markers
        markers.forEach((marker) => marker.setMap(null));
        markers = [];

        // Combine and deduplicate results
        const allResults: any = [];
        const seenPlaceIds: any = new Set();

        // Helper function to add results
        const addResults: any = (results) => {
          if (results) {
            results.forEach((place) => {
              if (!seenPlaceIds.has(place.place_id)) {
                allResults.push(place);
                seenPlaceIds.add(place.place_id);
              }
            });
          }
        };

        // Process all results in order of priority
        addResults(poolResults);
        addResults(barResults);
        addResults(hotelResults);

        console.log('Found total venues:', allResults.length);

        // Process all results
        allResults.forEach((place) => {
          if (!place.geometry || !place.geometry.location) return;

          // Log each place for debugging
          console.log(
            'Checking place:',
            place.name,
            '(types:',
            place.types.join(', '),
            ')'
          );

          // Filtering logic
          const nameLower: any = place.name.toLowerCase();
          const isPoolVenue: any =
            // Dedicated pool/snooker venues get automatic inclusion
            nameLower.includes('pool') ||
            nameLower.includes('snooker') ||
            nameLower.includes('billiard') ||
            nameLower.includes('8 ball') ||
            // Include Q-Masters specifically as it's a known pool venue
            nameLower.includes('q-masters') ||
            // Include bars and hotels, but be more selective
            ((place.types.includes('bar') ||
              place.types.includes('night_club') ||
              place.types.includes('pub') ||
              (place.types.includes('lodging') &&
                (nameLower.includes('hotel') ||
                  nameLower.includes('tavern') ||
                  nameLower.includes('pub')))) &&
              // Exclude venues that are likely not pool venues
              !nameLower.includes('swim') &&
              !nameLower.includes('motel') &&
              !nameLower.includes('apartment') &&
              !nameLower.includes('holiday') &&
              !nameLower.includes('resort') &&
              !nameLower.includes('luxury') &&
              !place.types.includes('swimming_pool') &&
              // Only include stores if they're explicitly pool/billiards related
              (!place.types.includes('store') ||
                (place.types.includes('store') &&
                  (nameLower.includes('pool') ||
                    nameLower.includes('snooker') ||
                    nameLower.includes('billiard')))));

          if (!isPoolVenue) {
            console.log('Skipping venue:', place.name, '(not a pool venue)');
            return;
          }

          console.log('Adding marker for:', place.name);

          // Create marker with default neutral status
          const markerView: any = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: place.geometry.location,
            title: place.name,
            content: createDojoMarker({
              status: VenueStatus.NEUTRAL,
              rank: determineVenueRank(place),
              hasActiveEvent: false,
              name: place.name,
              types: place.types,
              rating: place.rating,
            }),
          });

          markers.push(markerView);

          // Create info window
          const infoWindow: any = new google.maps.InfoWindow({
            content: createInfoWindowContent(place, nameLower),
          });

          markerView.addListener('click', () => {
            if (currentInfoWindow) {
              currentInfoWindow.close();
            }
            infoWindow.open(map, markerView);
            currentInfoWindow = infoWindow;
          });
        });

        if (markers.length === 0) {
          console.log('No venues found after filtering');
          showError(
            'No pool or snooker venues found in this area. Try increasing the search radius.'
          );
        } else {
          console.log('Found pool venues:', markers.length);
        }
      });
    });
  });
}

// Error handling function
function handleLocationError(browserHasGeolocation, pos) {
  showError(
    browserHasGeolocation
      ? 'Error: The Geolocation service failed.'
      : "Error: Your browser doesn't support geolocation."
  );
}

// Error display function
function showError(message: any): any {
  console.error(message);
  const mapDiv: any = document.getElementById('venue-map');
  if (mapDiv) {
    const errorDiv: any = document.createElement('div');
    errorDiv.className = 'map-error';
    errorDiv.textContent = message;
    mapDiv.appendChild(errorDiv);
  }
}

// Helper function to determine venue rank based on various factors
function determineVenueRank(place: any): any {
  // Default to beginner
  if (!place) return VenueRank.BEGINNER;

  const nameLower: any = place.name.toLowerCase();

  // Dedicated pool/snooker venues start at intermediate
  if (
    nameLower.includes('pool') ||
    nameLower.includes('snooker') ||
    nameLower.includes('billiard')
  ) {
    return VenueRank.INTERMEDIATE;
  }

  // Professional/competition venues are advanced
  if (
    nameLower.includes('professional') ||
    nameLower.includes('pro') ||
    nameLower.includes('club')
  ) {
    return VenueRank.ADVANCED;
  }

  // High-rated venues with many reviews are master rank
  if (place.rating >= 4.5 && place.user_ratings_total > 1000) {
    return VenueRank.MASTER;
  }

  return VenueRank.BEGINNER;
}

// Create info window content
function createInfoWindowContent(place, nameLower) {
  const venueType: any =
    nameLower.includes('pool') ||
    nameLower.includes('snooker') ||
    nameLower.includes('billiard')
      ? '🎱 Dedicated Pool/Snooker Venue'
      : place.types.includes('bar')
        ? '🍺 Pub with Pool Tables'
        : '🏨 Hotel with Pool Tables';

  return `
    <div class="venue-info">
      <h3>${place.name}</h3>
      <p>${place.vicinity}</p>
      ${place.rating ? `<p>Rating: ${place.rating} ⭐ (${place.user_ratings_total} reviews)</p>` : ''}
      <p class="venue-type">${venueType}</p>
      <div class="venue-status">
        <p>Status: ${VenueStatus.NEUTRAL}</p>
        <p>Rank: ${determineVenueRank(place)}</p>
      </div>
      <a href="/venues/${place.place_id}" class="venue-link">View Details</a>
    </div>
  `;
}

// Add venue interaction functions
function checkVenueUnlock(venue, playerPosition) {
  const distance: any = google.maps.geometry.spherical.computeDistanceBetween(
    playerPosition,
    venue.geometry.location
  );

  if (distance <= VenueProgression.UNLOCK_RADIUS) {
    // Check if venue should be unlocked based on player level and nearby captured venues
    const nearbyVenues: any = getNearbyVenues(
      venue.geometry.location,
      VenueProgression.INFLUENCE_RADIUS
    );
    const canUnlock: any = checkUnlockRequirements(venue, nearbyVenues);

    if (canUnlock) {
      unlockVenue(venue);
      updateTerritoryOverlay();
    }
  }
}

function checkVenueCapture(venue, playerPosition) {
  const distance: any = google.maps.geometry.spherical.computeDistanceBetween(
    playerPosition,
    venue.geometry.location
  );

  if (distance <= VenueProgression.CAPTURE_RADIUS) {
    startVenueCapture(venue);
  } else {
    cancelVenueCapture(venue);
  }
}

function startVenueCapture(venue: any): any {
  if (!venue.captureTimer) {
    venue.captureStartTime = Date.now();
    venue.captureTimer = setInterval(() => {
      const timeSpent: any = (Date.now() - venue.captureStartTime) / 1000;
      if (timeSpent >= VenueProgression.MIN_VISIT_TIME) {
        captureVenue(venue);
        clearInterval(venue.captureTimer);
        venue.captureTimer = null;
      }
      updateCaptureProgress(venue, timeSpent);
    }, 1000);
  }
}

function captureVenue(venue: any): any {
  venue.status = VenueStatus.OWNED;
  PlayerStats.capturedVenues++;
  PlayerStats.influence += getVenueInfluence(venue);
  updatePlayerTerritory(venue);
  updateMarkerAppearance(venue);
}

function updatePlayerTerritory(venue: any): any {
  PlayerStats.territory.push({
    center: venue.geometry.location,
    radius: VenueProgression.INFLUENCE_RADIUS,
    venue: venue,
  });
  updateTerritoryOverlay();
}

// Add territory visualization
let territoryOverlay = null;

function updateTerritoryOverlay(): any {
  if (territoryOverlay) {
    territoryOverlay.setMap(null);
  }

  const coordinates: any = PlayerStats.territory.map((territory) => ({
    lat: territory.center.lat(),
    lng: territory.center.lng(),
  }));

  if (coordinates.length > 0) {
    territoryOverlay = new google.maps.Polygon({
      paths: generateTerritoryBoundary(coordinates),
      strokeColor: '#4CAF50',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4CAF50',
      fillOpacity: 0.15,
      map: map,
    });
  }
}

function generateTerritoryBoundary(centers: any): any {
  // Implementation of territory boundary generation
  // This would use computational geometry to create a smooth boundary
  // around the influence areas of captured venues
  // For now, return a simple convex hull of the points
  return computeConvexHull(centers);
}

// Update the searchVenues function to include progression checks
const originalSearchVenues: any = searchVenues;
searchVenues = function (location) {
  originalSearchVenues(location);

  // Add periodic checks for venue interactions
  setInterval(() => {
    if (playerMarker) {
      const playerPos: any = playerMarker.position;
      markers.forEach((marker) => {
        const venue: any = marker.venue;
        if (venue) {
          checkVenueUnlock(venue, playerPos);
          if (venue.status !== VenueStatus.LOCKED) {
            checkVenueCapture(venue, playerPos);
          }
        }
      });
    }
  }, 1000);
};

// Helper functions for venue progression
function getNearbyVenues(location, radius) {
  return markers
    .filter((marker) => {
      const distance: any =
        google.maps.geometry.spherical.computeDistanceBetween(
          location,
          marker.position
        );
      return distance <= radius;
    })
    .map((marker) => marker.venue);
}

function checkUnlockRequirements(venue, nearbyVenues) {
  // Check if player level is sufficient
  if (PlayerStats.level < getVenueMinLevel(venue)) {
    return false;
  }

  // Check if player has captured enough nearby venues
  const capturedNearby: any = nearbyVenues.filter(
    (v) => v.status === VenueStatus.OWNED
  ).length;
  return capturedNearby >= getRequiredCaptures(venue);
}

function getVenueMinLevel(venue: any): any {
  switch (venue.rank) {
    case VenueRank.BEGINNER:
      return 1;
    case VenueRank.INTERMEDIATE:
      return 3;
    case VenueRank.ADVANCED:
      return 5;
    case VenueRank.MASTER:
      return 8;
    default:
      return 1;
  }
}

function getRequiredCaptures(venue: any): any {
  switch (venue.rank) {
    case VenueRank.BEGINNER:
      return 0;
    case VenueRank.INTERMEDIATE:
      return 2;
    case VenueRank.ADVANCED:
      return 4;
    case VenueRank.MASTER:
      return 6;
    default:
      return 0;
  }
}

function getVenueInfluence(venue: any): any {
  switch (venue.rank) {
    case VenueRank.BEGINNER:
      return 10;
    case VenueRank.INTERMEDIATE:
      return 25;
    case VenueRank.ADVANCED:
      return 50;
    case VenueRank.MASTER:
      return 100;
    default:
      return 10;
  }
}

function unlockVenue(venue: any): any {
  venue.status = VenueStatus.NEUTRAL;
  updateMarkerAppearance(venue);
  showUnlockAnimation(venue);
}

function updateMarkerAppearance(venue: any): any {
  const marker: any = markers.find((m) => m.venue === venue);
  if (marker) {
    marker.content = createDojoMarker({
      ...venue,
      hasActiveEvent: venue.hasActiveEvent,
    });
  }
}

function updateCaptureProgress(venue, timeSpent) {
  const progress: any = Math.min(
    (timeSpent / VenueProgression.MIN_VISIT_TIME) * 100,
    100
  );
  showCaptureProgress(venue, progress);
}

function cancelVenueCapture(venue: any): any {
  if (venue.captureTimer) {
    clearInterval(venue.captureTimer);
    venue.captureTimer = null;
    hideCaptureProgress(venue);
  }
}

// Visual feedback functions
function showUnlockAnimation(venue: any): any {
  const marker: any = markers.find((m) => m.venue === venue);
  if (marker) {
    const element: any = marker.content;
    element.style.animation = 'dojoUnlock 1s ease-out';
    setTimeout(() => {
      element.style.animation = getVenueAnimation(venue.status);
    }, 1000);
  }
}

function showCaptureProgress(venue, progress) {
  const marker: any = markers.find((m) => m.venue === venue);
  if (marker) {
    // Update progress circle in the marker
    const progressElement: any =
      marker.content.querySelector('.capture-progress');
    if (!progressElement) {
      const circle: any = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circle.classList.add('capture-progress');
      circle.setAttribute('cx', '25');
      circle.setAttribute('cy', '25');
      circle.setAttribute('r', '20');
      circle.setAttribute('stroke', '#4CAF50');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('fill', 'none');
      marker.content.querySelector('svg').appendChild(circle);
    }
    const circumference: any = 2 * Math.PI * 20;
    const offset: any = circumference - (progress / 100) * circumference;
    progressElement.style.strokeDasharray = `${circumference} ${circumference}`;
    progressElement.style.strokeDashoffset = offset;
  }
}

function hideCaptureProgress(venue: any): any {
  const marker: any = markers.find((m) => m.venue === venue);
  if (marker) {
    const progressElement: any =
      marker.content.querySelector('.capture-progress');
    if (progressElement) {
      progressElement.remove();
    }
  }
}

// Add new CSS animations
const captureStyles: any = `
  @keyframes dojoUnlock {
    0% { transform: scale(1.2); filter: brightness(1); }
    50% { transform: scale(1.5); filter: brightness(2); }
    100% { transform: scale(1.2); filter: brightness(1); }
  }

  .capture-progress {
    transition: stroke-dashoffset 0.1s linear;
    transform: rotate(-90deg);
    transform-origin: center;
  }
`;
style.textContent += captureStyles;

// Event system constants
const EventTypes: any = {
  CHALLENGE: 'challenge',
  TOURNAMENT: 'tournament',
  TRAINING: 'training',
  BOSS_BATTLE: 'boss_battle',
};

const EventRewards: any = {
  EXPERIENCE: 'experience',
  INFLUENCE: 'influence',
  SPECIAL_ITEM: 'special_item',
  VENUE_UPGRADE: 'venue_upgrade',
};

// Event management
const activeEvents = new Map();

function generateEvent(venue: any): any {
  const event: any = {
    id: `event_${Date.now()}_${venue.place_id}`,
    type: selectEventType(venue),
    venue: venue,
    startTime: Date.now(),
    duration: getEventDuration(venue.rank),
    rewards: generateEventRewards(venue.rank),
    requirements: generateEventRequirements(venue.rank),
    participants: new Set(),
    status: 'active',
  };

  activeEvents.set(event.id, event);
  venue.hasActiveEvent = true;
  updateMarkerAppearance(venue);

  return event;
}

function selectEventType(venue: any): any {
  const random: any = Math.random();
  if (venue.rank === VenueRank.MASTER) {
    return random < 0.3 ? EventTypes.BOSS_BATTLE : EventTypes.TOURNAMENT;
  }
  if (venue.status === VenueStatus.OWNED) {
    return random < 0.5 ? EventTypes.TRAINING : EventTypes.CHALLENGE;
  }
  return EventTypes.CHALLENGE;
}

function getEventDuration(rank: any): any {
  const baseTime: any = 3600000; // 1 hour in milliseconds
  switch (rank) {
    case VenueRank.BEGINNER:
      return baseTime;
    case VenueRank.INTERMEDIATE:
      return baseTime * 2;
    case VenueRank.ADVANCED:
      return baseTime * 4;
    case VenueRank.MASTER:
      return baseTime * 8;
    default:
      return baseTime;
  }
}

function generateEventRewards(rank: any): any {
  const rewards: any = [];
  const baseXP: any = 100;
  const baseInfluence: any = 50;

  switch (rank) {
    case VenueRank.MASTER:
      rewards.push(
        { type: EventRewards.EXPERIENCE, amount: baseXP * 10 },
        { type: EventRewards.INFLUENCE, amount: baseInfluence * 10 },
        { type: EventRewards.SPECIAL_ITEM, item: 'legendary_cue' },
        { type: EventRewards.VENUE_UPGRADE, upgrade: 'master_dojo' }
      );
      break;
    case VenueRank.ADVANCED:
      rewards.push(
        { type: EventRewards.EXPERIENCE, amount: baseXP * 5 },
        { type: EventRewards.INFLUENCE, amount: baseInfluence * 5 },
        { type: EventRewards.SPECIAL_ITEM, item: 'rare_cue' }
      );
      break;
    case VenueRank.INTERMEDIATE:
      rewards.push(
        { type: EventRewards.EXPERIENCE, amount: baseXP * 2 },
        { type: EventRewards.INFLUENCE, amount: baseInfluence * 2 }
      );
      break;
    default:
      rewards.push(
        { type: EventRewards.EXPERIENCE, amount: baseXP },
        { type: EventRewards.INFLUENCE, amount: baseInfluence }
      );
  }

  return rewards;
}

function generateEventRequirements(rank: any): any {
  return {
    minLevel: getVenueMinLevel({ rank }),
    minInfluence: getVenueInfluence({ rank }),
    teamSize: rank === VenueRank.MASTER ? 4 : 1,
  };
}

// Event participation
function joinEvent(eventId: any): any {
  const event: any = activeEvents.get(eventId);
  if (!event) return false;

  if (checkEventRequirements(event)) {
    event.participants.add(PlayerStats.id);
    updateEventDisplay(event);
    return true;
  }

  return false;
}

function checkEventRequirements(event: any): any {
  return (
    PlayerStats.level >= event.requirements.minLevel &&
    PlayerStats.influence >= event.requirements.minInfluence
  );
}

function updateEventDisplay(event: any): any {
  const marker: any = markers.find((m) => m.venue === event.venue);
  if (marker) {
    const eventIndicator: any =
      marker.content.querySelector('.event-indicator');
    if (eventIndicator) {
      eventIndicator.innerHTML = generateEventIndicator(event);
    }
  }
}

function generateEventIndicator(event: any): any {
  const timeLeft: any = Math.max(
    0,
    (event.startTime + event.duration - Date.now()) / 1000
  );
  const hours: any = Math.floor(timeLeft / 3600);
  const minutes: any = Math.floor((timeLeft % 3600) / 60);

  return `
    <div class="event-timer">
      <span class="event-type">${event.type}</span>
      <span class="time-left">${hours}h ${minutes}m</span>
      <span class="participants">${event.participants.size}/${event.requirements.teamSize}</span>
    </div>
  `;
}

// Event cleanup
setInterval(() => {
  const now: any = Date.now();
  for (const [eventId, event] of activeEvents.entries()) {
    if (now > event.startTime + event.duration) {
      completeEvent(event);
      activeEvents.delete(eventId);
    } else {
      updateEventDisplay(event);
    }
  }
}, 60000); // Check every minute

function completeEvent(event: any): any {
  if (event.participants.has(PlayerStats.id)) {
    distributeRewards(event);
  }
  event.venue.hasActiveEvent = false;
  updateMarkerAppearance(event.venue);
}

function distributeRewards(event: any): any {
  event.rewards.forEach((reward) => {
    switch (reward.type) {
      case EventRewards.EXPERIENCE:
        PlayerStats.experience += reward.amount;
        checkLevelUp();
        break;
      case EventRewards.INFLUENCE:
        PlayerStats.influence += reward.amount;
        break;
      case EventRewards.SPECIAL_ITEM:
        addItemToInventory(reward.item);
        break;
      case EventRewards.VENUE_UPGRADE:
        upgradeVenue(event.venue, reward.upgrade);
        break;
    }
  });
}

// Territory Control System
const TerritoryConstants: any = {
  MIN_INFLUENCE: 100,
  INFLUENCE_DECAY: 0.1, // per hour
  TERRITORY_UPDATE_INTERVAL: 300000, // 5 minutes
  CONFLICT_THRESHOLD: 0.8, // 80% overlap for territory conflicts
};

class Territory {
  constructor(center, owner) {
    this.center = center;
    this.owner = owner;
    this.influence = TerritoryConstants.MIN_INFLUENCE;
    this.radius = Math.sqrt(this.influence) * 10; // Scale radius based on influence
    this.lastUpdate = Date.now();
    this.conflictZones = new Set();
  }

  updateInfluence(amount) {
    const timeDiff: any = (Date.now() - this.lastUpdate) / (1000 * 60 * 60); // hours
    this.influence = Math.max(
      TerritoryConstants.MIN_INFLUENCE,
      this.influence * (1 - TerritoryConstants.INFLUENCE_DECAY * timeDiff) +
        amount
    );
    this.radius = Math.sqrt(this.influence) * 10;
    this.lastUpdate = Date.now();
  }
}

const territories = new Map();
const territoryPolygons = new Map();
let heatmap = null;

function initializeTerritorySystem(): any {
  // Check if visualization library is available
  if (google.maps.visualization) {
    // Create heatmap layer for influence visualization
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: [],
      map: map,
      radius: 50,
      opacity: 0.6,
      gradient: [
        'rgba(0, 0, 0, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)',
      ],
    });
  } else {
    console.log(
      'Visualization library not loaded, using polygon visualization only'
    );
    heatmap = null;
  }

  // Start territory update loop
  setInterval(updateTerritories, TerritoryConstants.TERRITORY_UPDATE_INTERVAL);
}

function createTerritory(venue: any): any {
  const territory: any = new Territory(venue.geometry.location, PlayerStats.id);
  territories.set(venue.place_id, territory);
  updateTerritoryVisualization();
}

function updateTerritories(): any {
  const now: any = Date.now();
  const heatmapData: any = [];

  territories.forEach((territory, venueId) => {
    // Update influence
    territory.updateInfluence(0); // Natural decay

    // Check for conflicts
    territory.conflictZones.clear();
    territories.forEach((otherTerritory, otherId) => {
      if (
        venueId !== otherId &&
        checkTerritoryConflict(territory, otherTerritory)
      ) {
        territory.conflictZones.add(otherId);
      }
    });

    // Add to heatmap data if available
    if (heatmap) {
      heatmapData.push({
        location: territory.center,
        weight: territory.influence,
      });
    }
  });

  // Update heatmap if available
  if (heatmap) {
    heatmap.setData(heatmapData);
  }

  // Update territory visualization
  updateTerritoryVisualization();
}

function checkTerritoryConflict(territory1, territory2) {
  const distance: any = google.maps.geometry.spherical.computeDistanceBetween(
    territory1.center,
    territory2.center
  );

  const overlapDistance: any = territory1.radius + territory2.radius - distance;
  const smallerRadius: any = Math.min(territory1.radius, territory2.radius);

  return (
    overlapDistance > 0 &&
    overlapDistance / smallerRadius > TerritoryConstants.CONFLICT_THRESHOLD
  );
}

function updateTerritoryVisualization(): any {
  // Clear existing polygons
  territoryPolygons.forEach((polygon) => polygon.setMap(null));
  territoryPolygons.clear();

  // Create new polygons for each territory
  territories.forEach((territory, venueId) => {
    const color: any = territory.conflictZones.size > 0 ? '#FF4444' : '#4CAF50';
    const opacity: any = territory.conflictZones.size > 0 ? 0.4 : 0.2;

    const polygon: any = new google.maps.Polygon({
      paths: generateTerritoryBoundary([territory]),
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: opacity,
      map: map,
    });

    territoryPolygons.set(venueId, polygon);

    // Add click listener for territory info
    polygon.addListener('click', () => {
      showTerritoryInfo(territory);
    });
  });
}

function generateTerritoryBoundary(territory: any): any {
  const points: any = [];
  const numPoints: any = 32; // Number of points to create the circle

  for (let i = 0; i < numPoints; i++) {
    const angle: any = (i / numPoints) * 2 * Math.PI;
    const lat: any =
      territory.center.lat() + (territory.radius / 111300) * Math.cos(angle);
    const lng: any =
      territory.center.lng() +
      (territory.radius /
        (111300 * Math.cos((territory.center.lat() * Math.PI) / 180))) *
        Math.sin(angle);
    points.push({ lat, lng });
  }

  return points;
}

function showTerritoryInfo(territory: any): any {
  const venue: any = markers.find(
    (m) => m.venue.place_id === territory.venueId
  )?.venue;
  if (!venue) return;

  const infoWindow: any = new google.maps.InfoWindow({
    content: `
      <div class="territory-info">
        <h3>Territory Info</h3>
        <p>Influence: ${Math.round(territory.influence)}</p>
        <p>Radius: ${Math.round(territory.radius)}m</p>
        <p>Conflicts: ${territory.conflictZones.size}</p>
        ${territory.conflictZones.size > 0 ? '<p class="warning">⚠️ Territory under contest</p>' : ''}
      </div>
    `,
  });

  infoWindow.setPosition(territory.center);
  infoWindow.open(map);
}

// Initialize territory system when map loads
const originalInitMap: any = window.initMap;
window.initMap = function () {
  originalInitMap();
  initializeTerritorySystem();
};

function checkLevelUp(): any {
  while (
    PlayerStats.experience >= PlayerStats.nextLevelXP &&
    PlayerStats.level < PlayerProgression.MAX_LEVEL
  ) {
    levelUp();
  }
}

function levelUp(): any {
  PlayerStats.level++;
  const oldNextLevelXP: any = PlayerStats.nextLevelXP;
  PlayerStats.nextLevelXP = Math.floor(
    PlayerProgression.LEVEL_XP_BASE *
      Math.pow(PlayerProgression.LEVEL_XP_MULTIPLIER, PlayerStats.level - 1)
  );

  // Update player rank
  updatePlayerRank();

  // Show level up notification
  showLevelUpNotification(PlayerStats.level, oldNextLevelXP);

  // Check for unlocked achievements
  checkLevelAchievements();
}

function updatePlayerRank(): any {
  const ranks: any = [
    { level: 1, rank: 'Novice' },
    { level: 5, rank: 'Amateur' },
    { level: 10, rank: 'Intermediate' },
    { level: 15, rank: 'Advanced' },
    { level: 20, rank: 'Expert' },
    { level: 25, rank: 'Master' },
    { level: 30, rank: 'Grandmaster' },
    { level: 35, rank: 'Legend' },
    { level: 40, rank: 'Mythic' },
    { level: 45, rank: 'Divine' },
    { level: 50, rank: 'Pool God' },
  ];

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (PlayerStats.level >= ranks[i].level) {
      PlayerStats.rank = ranks[i].rank;
      break;
    }
  }
}

function showLevelUpNotification(level, oldNextLevelXP) {
  const notification: any = document.createElement('div');
  notification.className = 'level-up-notification';
  notification.innerHTML = `
    <div class="level-up-content">
      <h2>Level Up!</h2>
      <p>You've reached level ${level}</p>
      <p>New rank: ${PlayerStats.rank}</p>
      <p>XP gained: ${PlayerStats.nextLevelXP - oldNextLevelXP}</p>
      <div class="level-up-rewards">
        <h3>Rewards:</h3>
        <ul>
          ${getLevelUpRewards(level)
            .map((reward) => `<li>${reward}</li>`)
            .join('')}
        </ul>
      </div>
    </div>
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function getLevelUpRewards(level: any): any {
  const rewards: any = [];

  // Basic rewards
  rewards.push(`+${level * 10} Influence`);
  PlayerStats.influence += level * 10;

  // Special level rewards
  if (level % 5 === 0) {
    rewards.push('New Title Unlocked: ' + getNewTitle(level));
    PlayerStats.titles.add(getNewTitle(level));
  }

  if (level % 10 === 0) {
    rewards.push('Special Item: ' + getSpecialItem(level));
    addItemToInventory(getSpecialItem(level));
  }

  return rewards;
}

function getNewTitle(level: any): any {
  const titles: any = {
    5: 'Pool Apprentice',
    10: 'Cue Master',
    15: 'Shot Caller',
    20: 'Table Titan',
    25: 'Pocket Prophet',
    30: 'Break Baron',
    35: 'Spin Sovereign',
    40: 'Rack Ruler',
    45: 'Cushion King',
    50: 'Pool Legend',
  };
  return titles[level] || 'Unknown Title';
}

function getSpecialItem(level: any): any {
  const items: any = {
    10: 'Professional Cue',
    20: 'Lucky Chalk',
    30: 'Golden Break Cue',
    40: 'Mythical Jump Cue',
    50: 'Legendary Pool God Cue',
  };
  return items[level] || 'Mystery Item';
}

// Achievement System
function checkAchievements(): any {
  // First Capture
  if (
    !PlayerStats.achievements.has(PlayerAchievements.FIRST_CAPTURE) &&
    PlayerStats.capturedVenues > 0
  ) {
    unlockAchievement(PlayerAchievements.FIRST_CAPTURE);
  }

  // Territory Master
  if (
    !PlayerStats.achievements.has(PlayerAchievements.TERRITORY_MASTER) &&
    territories.size >= 10
  ) {
    unlockAchievement(PlayerAchievements.TERRITORY_MASTER);
  }

  // Event Winner
  if (
    !PlayerStats.achievements.has(PlayerAchievements.EVENT_WINNER) &&
    PlayerStats.eventWins > 0
  ) {
    unlockAchievement(PlayerAchievements.EVENT_WINNER);
  }

  // Venue Collector
  if (
    !PlayerStats.achievements.has(PlayerAchievements.VENUE_COLLECTOR) &&
    PlayerStats.capturedVenues >= 20
  ) {
    unlockAchievement(PlayerAchievements.VENUE_COLLECTOR);
  }

  // Influence King
  if (
    !PlayerStats.achievements.has(PlayerAchievements.INFLUENCE_KING) &&
    PlayerStats.influence >= 1000
  ) {
    unlockAchievement(PlayerAchievements.INFLUENCE_KING);
  }
}

function unlockAchievement(achievement: any): any {
  PlayerStats.achievements.add(achievement);

  // Show achievement notification
  const notification: any = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-content">
      <h3>Achievement Unlocked!</h3>
      <p>${getAchievementDetails(achievement).name}</p>
      <p>${getAchievementDetails(achievement).description}</p>
      <p>Reward: ${getAchievementDetails(achievement).reward}</p>
    </div>
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);

  // Grant achievement rewards
  grantAchievementReward(achievement);
}

function getAchievementDetails(achievement: any): any {
  const achievements: any = {
    [PlayerAchievements.FIRST_CAPTURE]: {
      name: 'First Steps',
      description: 'Capture your first venue',
      reward: '+100 XP',
    },
    [PlayerAchievements.TERRITORY_MASTER]: {
      name: 'Territory Master',
      description: 'Control 10 territories simultaneously',
      reward: '+500 XP, Title: Territory Lord',
    },
    [PlayerAchievements.EVENT_WINNER]: {
      name: 'Champion',
      description: 'Win your first event',
      reward: '+300 XP, Special Item',
    },
    [PlayerAchievements.VENUE_COLLECTOR]: {
      name: 'Venue Collector',
      description: 'Capture 20 different venues',
      reward: '+1000 XP, Title: Venue Hunter',
    },
    [PlayerAchievements.INFLUENCE_KING]: {
      name: 'Influence King',
      description: 'Reach 1000 influence points',
      reward: '+2000 XP, Title: Influence Master',
    },
  };
  return achievements[achievement];
}

function grantAchievementReward(achievement: any): any {
  const details: any = getAchievementDetails(achievement);

  // Parse XP reward
  const xpMatch: any = details.reward.match(/\+(\d+) XP/);
  if (xpMatch) {
    PlayerStats.experience += parseInt(xpMatch[1]);
    checkLevelUp();
  }

  // Parse title reward
  const titleMatch: any = details.reward.match(/Title: ([^,]+)/);
  if (titleMatch) {
    PlayerStats.titles.add(titleMatch[1]);
  }

  // Handle special items
  if (details.reward.includes('Special Item')) {
    addItemToInventory(getAchievementItem(achievement));
  }
}

function getAchievementItem(achievement: any): any {
  const items: any = {
    [PlayerAchievements.EVENT_WINNER]: 'Victory Cue',
    [PlayerAchievements.TERRITORY_MASTER]: 'Territory Crown',
    [PlayerAchievements.INFLUENCE_KING]: 'Influence Scepter',
  };
  return items[achievement] || 'Mystery Trophy';
}

// Add CSS for notifications
const progressionStyles: any = document.createElement('style');
progressionStyles.textContent = `
  .level-up-notification, .achievement-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 1000;
    animation: slideIn 0.5s ease-out;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .level-up-content, .achievement-content {
    text-align: center;
  }
  
  .level-up-rewards {
    margin-top: 10px;
    text-align: left;
  }
  
  .level-up-rewards ul {
    margin: 5px 0;
    padding-left: 20px;
  }
`;
document.head.appendChild(progressionStyles);
