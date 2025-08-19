# DojoPool Map Customization Guide

## Overview

This guide explains how to customize the DojoPool World Hub Map with custom styles, colors, and branding. The map uses Mapbox GL JS with custom styling and data layers.

## 🎨 Custom Map Styles

### Color Palette

The DojoPool map uses a carefully crafted color scheme that reflects the game's aesthetic:

```typescript
colors: {
  primary: '#ff6b6b',      // Crimson Monkey red
  secondary: '#ffd93d',    // Golden Dragon yellow
  tertiary: '#45b7d1',     // Silver Serpent blue
  accent: '#4ecdc4',       // Teal accent
  background: '#1a1a1a',   // Dark background
  surface: '#2d2d2d',      // Surface elements
  text: '#ffffff',         // White text
  textSecondary: '#b3b3b3' // Secondary text
}
```

### Clan-Specific Colors

Each clan has its own signature color for easy identification:

- **Crimson Monkey**: `#ff6b6b` (Red)
- **Golden Dragon**: `#ffd93d` (Yellow)
- **Silver Serpent**: `#45b7d1` (Blue)

## 🗺️ Map Layers

### Base Map Style

The map uses Mapbox's dark theme as a base:

```typescript
baseStyle: 'mapbox://styles/mapbox/dark-v11';
```

### Custom Data Layers

1. **Venues Layer** (`dojopool-venues`)

   - Large circular markers (12px radius)
   - Clan-colored with white borders
   - Represents Dojo locations

2. **Players Layer** (`dojopool-players`)

   - Medium circular markers (8px radius)
   - Clan-colored with white borders
   - Shows player locations

3. **Territories Layer** (`dojopool-territories`)

   - Polygon fills with clan colors
   - Low opacity (0.1) with colored outlines
   - Represents controlled areas

4. **Territory Labels** (`dojopool-territory-labels`)
   - White text with dark halos
   - Bold Open Sans font
   - Centered on territory areas

## 🎭 Visual Customization

### Marker Styling

```typescript
// Venue markers
venues: {
  'circle-radius': 12,
  'circle-color': ['get', 'clanColor'],
  'circle-stroke-color': '#ffffff',
  'circle-stroke-width': 2,
  'circle-opacity': 0.9
}

// Player markers
players: {
  'circle-radius': 8,
  'circle-color': ['get', 'clanColor'],
  'circle-stroke-color': '#ffffff',
  'circle-stroke-width': 1,
  'circle-opacity': 0.8
}
```

### Territory Styling

```typescript
territories: {
  'fill-color': ['get', 'clanColor'],
  'fill-opacity': 0.1,
  'fill-outline-color': ['get', 'clanColor'],
  'fill-outline-opacity': 0.6
}
```

### Map Background Customization

```typescript
mapStyle: {
  'background-color': '#1a1a1a',
  'land-color': '#2d2d2d',
  'water-color': '#1e3a8a',
  'road-color': '#404040',
  'building-color': '#404040'
}
```

## 🚀 Implementation

### 1. Import Custom Styles

```typescript
import {
  DOJOPOOL_MAP_STYLE,
  applyDojoPoolStyling,
  createCustomLayers,
} from '../styles/dojopool-map-style';
```

### 2. Apply to Map Instance

```typescript
// After map loads
map.on('load', () => {
  applyDojoPoolStyling(map);

  // Add custom data sources
  map.addSource('dojopool-venues', {
    type: 'geojson',
    data: venuesData,
  });

  // Add custom layers
  const layers = createCustomLayers();
  map.addLayer(layers.venues);
  map.addLayer(layers.players);
  map.addLayer(layers.territories);
});
```

### 3. Dynamic Styling Updates

```typescript
// Update marker colors based on clan
function updateClanColors(clanName: string, newColor: string) {
  map.setPaintProperty('dojopool-venues', 'circle-color', [
    'case',
    ['==', ['get', 'controllingClan'], clanName],
    newColor,
    ['get', 'clanColor'],
  ]);
}
```

## 🎯 Animation & Interactions

### Marker Animations

```typescript
animations: {
  markerPulse: {
    duration: 2000,
    easing: 'easeInOut'
  },
  territoryGlow: {
    duration: 3000,
    easing: 'easeInOut'
  }
}
```

### Hover Effects

```typescript
interactions: {
  hoverOpacity: 0.8,
  selectedOpacity: 1.0,
  clickRadius: 20
}
```

## 🔧 Advanced Customization

### Custom Map Sources

```typescript
// Add custom tileset
map.addSource('custom-tileset', {
  type: 'vector',
  url: 'mapbox://your-username.your-tileset-id',
});

// Add custom layer
map.addLayer({
  id: 'custom-layer',
  type: 'fill',
  source: 'custom-tileset',
  'source-layer': 'your-layer-name',
  paint: {
    'fill-color': '#ff6b6b',
    'fill-opacity': 0.3,
  },
});
```

### Filtering Data

```typescript
// Show only specific clan territories
map.setFilter('dojopool-territories', [
  '==',
  ['get', 'clan'],
  'Crimson Monkey',
]);

// Show venues above certain level
map.setFilter('dojopool-venues', ['>=', ['get', 'level'], 3]);
```

### Custom Popups

```typescript
// Create custom popup content
function createVenuePopup(venue) {
  return new mapboxgl.Popup().setLngLat(venue.geometry.coordinates).setHTML(`
      <div class="venue-popup">
        <h3>${venue.properties.name}</h3>
        <p>Clan: ${venue.properties.controllingClan}</p>
        <p>Level: ${venue.properties.level}</p>
        <p>Controller: ${venue.properties.controller}</p>
      </div>
    `);
}
```

## 🎨 Branding Integration

### Logo Placement

```typescript
// Add DojoPool logo to map
map.addImage('dojopool-logo', logoImage);
map.addLayer({
  id: 'logo-layer',
  type: 'symbol',
  layout: {
    'icon-image': 'dojopool-logo',
    'icon-size': 0.5,
    'icon-allow-overlap': true,
  },
  paint: {},
  filter: ['==', ['zoom'], 0],
});
```

### Custom Fonts

```typescript
// Load custom fonts
map.addFontFace('DojoPool-Bold', 'url(/fonts/DojoPool-Bold.woff2)');

// Use in text layers
map.setLayoutProperty('dojopool-territory-labels', 'text-font', [
  'DojoPool-Bold',
  'Open Sans Bold',
]);
```

## 📱 Responsive Design

### Mobile Optimization

```typescript
// Adjust marker sizes for mobile
const isMobile = window.innerWidth < 768;
const markerSize = isMobile ? 8 : 12;

map.setPaintProperty('dojopool-venues', 'circle-radius', markerSize);
```

### Touch Interactions

```typescript
// Custom touch handling
map.on('touchstart', 'dojopool-venues', (e) => {
  e.preventDefault();
  // Custom touch behavior
});
```

## 🔍 Performance Optimization

### Layer Management

```typescript
// Hide layers when not needed
function toggleLayerVisibility(layerId: string, visible: boolean) {
  if (visible) {
    map.setLayoutProperty(layerId, 'visibility', 'visible');
  } else {
    map.setLayoutProperty(layerId, 'visibility', 'none');
  }
}

// Optimize for zoom levels
map.on('zoom', () => {
  const zoom = map.getZoom();
  if (zoom < 10) {
    toggleLayerVisibility('dojopool-players', false);
  } else {
    toggleLayerVisibility('dojopool-players', true);
  }
});
```

## 🎯 Next Steps

1. **Test Custom Styles**: Apply the custom styling to your map
2. **Adjust Colors**: Modify the color palette to match your preferences
3. **Add Animations**: Implement marker animations and hover effects
4. **Create Custom Layers**: Add new data layers for additional features
5. **Optimize Performance**: Implement layer visibility and zoom-based optimizations

## 📚 Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [DojoPool Design System](../docs/design-system.md)
- [Mapbox Studio](https://studio.mapbox.com/)

Happy mapping! 🗺️✨
