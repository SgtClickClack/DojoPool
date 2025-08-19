/**
 * DojoPool Custom Map Style Configuration
 * Defines the visual styling for the World Hub Map
 */

export const DOJOPOOL_MAP_STYLE = {
  // Base map style - dark theme for DojoPool aesthetic
  baseStyle: 'mapbox://styles/mapbox/dark-v11',

  // Custom color palette for DojoPool branding
  colors: {
    primary: '#ff6b6b', // Crimson Monkey red
    secondary: '#ffd93d', // Golden Dragon yellow
    tertiary: '#45b7d1', // Silver Serpent blue
    accent: '#4ecdc4', // Teal accent
    background: '#1a1a1a', // Dark background
    surface: '#2d2d2d', // Surface elements
    text: '#ffffff', // White text
    textSecondary: '#b3b3b3', // Secondary text
  },

  // Clan-specific colors
  clanColors: {
    'Crimson Monkey': '#ff6b6b',
    'Golden Dragon': '#ffd93d',
    'Silver Serpent': '#45b7d1',
    default: '#4ecdc4',
  },

  // Map styling overrides
  mapStyle: {
    // Background styling
    'background-color': '#1a1a1a',

    // Land styling
    'land-color': '#2d2d2d',
    'water-color': '#1e3a8a',

    // Road styling
    'road-color': '#404040',
    'road-halo-color': '#1a1a1a',

    // Building styling
    'building-color': '#404040',
    'building-outline-color': '#1a1a1a',

    // Label styling
    'label-color': '#ffffff',
    'label-halo-color': '#1a1a1a',
  },

  // Layer styling for custom data
  layers: {
    // Venue markers
    venues: {
      'circle-radius': 12,
      'circle-color': ['get', 'clanColor'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9,
    },

    // Player markers
    players: {
      'circle-radius': 8,
      'circle-color': ['get', 'clanColor'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-opacity': 0.8,
    },

    // Territory boundaries
    territories: {
      'fill-color': ['get', 'clanColor'],
      'fill-opacity': 0.1,
      'fill-outline-color': ['get', 'clanColor'],
      'fill-outline-opacity': 0.6,
    },

    // Territory labels
    territoryLabels: {
      'text-color': '#ffffff',
      'text-halo-color': '#1a1a1a',
      'text-halo-width': 2,
      'text-size': 12,
      'text-font': ['Open Sans Bold'],
    },
  },

  // Animation settings
  animations: {
    markerPulse: {
      duration: 2000,
      easing: 'easeInOut',
    },
    territoryGlow: {
      duration: 3000,
      easing: 'easeInOut',
    },
  },

  // Interaction settings
  interactions: {
    hoverOpacity: 0.8,
    selectedOpacity: 1.0,
    clickRadius: 20,
  },
};

/**
 * Get clan color for a given clan name
 */
export function getClanColor(clanName: string): string {
  return (
    DOJOPOOL_MAP_STYLE.clanColors[
      clanName as keyof typeof DOJOPOOL_MAP_STYLE.clanColors
    ] || DOJOPOOL_MAP_STYLE.clanColors.default
  );
}

/**
 * Apply custom styling to a Mapbox map instance
 */
export function applyDojoPoolStyling(map: any) {
  // Apply custom paint properties to existing layers
  const layers = map.getStyle().layers;

  layers.forEach((layer: any) => {
    if (layer.type === 'background') {
      map.setPaintProperty(
        layer.id,
        'background-color',
        DOJOPOOL_MAP_STYLE.mapStyle['background-color']
      );
    }

    if (layer.type === 'fill' && layer.source === 'composite') {
      if (layer.id.includes('land')) {
        map.setPaintProperty(
          layer.id,
          'fill-color',
          DOJOPOOL_MAP_STYLE.mapStyle['land-color']
        );
      }
      if (layer.id.includes('water')) {
        map.setPaintProperty(
          layer.id,
          'fill-color',
          DOJOPOOL_MAP_STYLE.mapStyle['water-color']
        );
      }
    }

    if (layer.type === 'line' && layer.source === 'composite') {
      if (layer.id.includes('road')) {
        map.setPaintProperty(
          layer.id,
          'line-color',
          DOJOPOOL_MAP_STYLE.mapStyle['road-color']
        );
        map.setPaintProperty(layer.id, 'line-gap-width', 1);
      }
    }
  });
}

/**
 * Create custom layer styling for DojoPool data
 */
export function createCustomLayers() {
  return {
    venues: {
      id: 'dojopool-venues',
      type: 'circle',
      paint: DOJOPOOL_MAP_STYLE.layers.venues,
    },
    players: {
      id: 'dojopool-players',
      type: 'circle',
      paint: DOJOPOOL_MAP_STYLE.layers.players,
    },
    territories: {
      id: 'dojopool-territories',
      type: 'fill',
      paint: DOJOPOOL_MAP_STYLE.layers.territories,
    },
    territoryLabels: {
      id: 'dojopool-territory-labels',
      type: 'symbol',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-font': ['Open Sans Bold'],
        'text-anchor': 'center',
      },
      paint: DOJOPOOL_MAP_STYLE.layers.territoryLabels,
    },
  };
}
