# Mapbox CLI Setup for DojoPool

## Overview

This guide explains how to set up and use Mapbox CLI tools for managing your DojoPool map data, including venue locations, territory boundaries, and player positions.

## Prerequisites

1. **Mapbox Account**: Sign up at [Mapbox](https://www.mapbox.com/)
2. **Access Token**: Get your token from [Mapbox Account](https://account.mapbox.com/access-tokens/)
3. **Node.js**: Ensure you have Node.js installed (version 14 or higher)

## Installation

The Mapbox CLI tools are already installed as dev dependencies:

```bash
npm install --save-dev @mapbox/mapbox-sdk @mapbox/mapbox-gl-draw
```

## Environment Setup

### Option 1: Create .env.local file (Recommended)

Create a `.env.local` file in the `apps/web` directory:

```bash
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_mapbox_token_here
MAPBOX_ACCESS_TOKEN=your_actual_mapbox_token_here

# Environment
NODE_ENV=development
```

### Option 2: Set Environment Variables

**Windows PowerShell:**

```powershell
$env:MAPBOX_ACCESS_TOKEN="your_actual_mapbox_token_here"
$env:NEXT_PUBLIC_MAPBOX_TOKEN="your_actual_mapbox_token_here"
```

**Windows Command Prompt:**

```cmd
set MAPBOX_ACCESS_TOKEN=your_actual_mapbox_token_here
set NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_mapbox_token_here
```

**Linux/macOS:**

```bash
export MAPBOX_ACCESS_TOKEN="your_actual_mapbox_token_here"
export NEXT_PUBLIC_MAPBOX_TOKEN="your_actual_mapbox_token_here"
```

## Available CLI Commands

### 1. Setup and Configuration

```bash
npm run mapbox:setup
```

This command:

- Validates your Mapbox access token
- Checks environment configuration
- Provides setup instructions if needed

### 2. Data Upload Management

```bash
npm run mapbox:upload <command>
```

**Commands:**

- `venues` - Prepare Dojo venue location data
- `territories` - Prepare territory boundary data
- `players` - Prepare player location data
- `help` - Show usage information

**Examples:**

```bash
npm run mapbox:upload venues
npm run mapbox:upload territories
npm run mapbox:upload players
```

### 3. Tileset Management

```bash
npm run mapbox:tileset <command>
```

**Commands:**

- `list` - List available tilesets
- `create` - Create a new tileset
- `update` - Update an existing tileset
- `delete` - Delete a tileset
- `status` - Check tileset processing status
- `help` - Show usage information

**Examples:**

```bash
npm run mapbox:tileset list
npm run mapbox:tileset create --name=dojopool-venues
npm run mapbox:tileset status --id=your_tileset_id
```

## Data Formats

### Supported Formats

- **GeoJSON (.geojson)** - Recommended for most data
- **KML (.kml)** - For Google Earth compatibility
- **Shapefile (.shp)** - For GIS professionals

### Data Structure Examples

#### Venue Locations

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "The Jade Tiger",
        "type": "dojo",
        "controller": "RyuKlaw",
        "clan": "Crimson Monkey",
        "status": "active"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [153.0251, -27.4698]
      }
    }
  ]
}
```

#### Territory Boundaries

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Brisbane Central",
        "controller": "RyuKlaw",
        "clan": "Crimson Monkey",
        "level": 5,
        "income": 100
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [153.0151, -27.4798],
            [153.0351, -27.4798],
            [153.0351, -27.4598],
            [153.0151, -27.4598],
            [153.0151, -27.4798]
          ]
        ]
      }
    }
  ]
}
```

## Workflow

### 1. Initial Setup

```bash
# 1. Set your environment variables
# 2. Run setup validation
npm run mapbox:setup
```

### 2. Data Preparation

```bash
# 1. Prepare your data in GeoJSON format
# 2. Validate data structure
# 3. Test with CLI commands
npm run mapbox:upload venues
npm run mapbox:upload territories
```

### 3. Tileset Creation

```bash
# 1. Use Mapbox Studio or API to create tilesets
# 2. Upload your prepared data
# 3. Configure styling and layers
# 4. Publish tilesets
```

### 4. Integration

```bash
# 1. Update your World Hub Map component
# 2. Replace mock data with real tileset URLs
# 3. Test real-time updates
```

## Mapbox Studio Integration

For visual management of your data:

1. **Visit**: [Mapbox Studio](https://studio.mapbox.com/)
2. **Upload Data**: Use the Data tab to upload your GeoJSON files
3. **Create Tilesets**: Convert data to vector tiles
4. **Style Maps**: Customize the visual appearance
5. **Publish**: Make your maps available via API

## API Integration

Once you have tilesets, integrate them into your World Hub Map:

```typescript
// Example: Adding a custom tileset layer
map.addSource('dojopool-venues', {
  type: 'vector',
  url: 'mapbox://your-username.your-tileset-id',
});

map.addLayer({
  id: 'venues-layer',
  type: 'circle',
  source: 'dojopool-venues',
  'source-layer': 'venues',
  paint: {
    'circle-radius': 8,
    'circle-color': '#ff0000',
    'circle-opacity': 0.8,
  },
});
```

## Troubleshooting

### Common Issues

1. **"No Mapbox access token found"**

   - Run `npm run mapbox:setup` to check configuration
   - Verify environment variables are set correctly

2. **"Token format looks unusual"**

   - Ensure token starts with `pk.` (public) or `sk.` (secret)
   - Check token hasn't expired

3. **"Error uploading data"**
   - Verify data format is valid GeoJSON
   - Check token has appropriate permissions

### Getting Help

- **Mapbox Documentation**: [docs.mapbox.com](https://docs.mapbox.com/)
- **Mapbox Studio**: [studio.mapbox.com](https://studio.mapbox.com/)
- **Community Support**: [support.mapbox.com](https://support.mapbox.com/)

## Security Notes

- **Public Tokens**: Use `pk.` tokens for frontend applications
- **Secret Tokens**: Use `sk.` tokens for server-side operations only
- **Environment Variables**: Never commit tokens to version control
- **Token Permissions**: Grant only necessary scopes for your use case

## Next Steps

1. **Set up your environment variables**
2. **Run the setup validation**: `npm run mapbox:setup`
3. **Prepare your first dataset**: `npm run mapbox:upload venues`
4. **Create tilesets in Mapbox Studio**
5. **Integrate with your World Hub Map component**

Happy mapping! 🗺️
