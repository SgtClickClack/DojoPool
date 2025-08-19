#!/usr/bin/env node

/**
 * Mapbox Upload CLI Script
 * Handles data uploads to Mapbox for DojoPool venues and territories
 */

const MapboxClient = require('@mapbox/mapbox-sdk');
const fs = require('fs');
const path = require('path');

console.log('📤 Mapbox Upload CLI for DojoPool\n');

// Initialize Mapbox client
const mapboxToken =
  process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  console.log('❌ No Mapbox access token found! Run: npm run mapbox:setup');
  process.exit(1);
}

const mapboxClient = MapboxClient({ accessToken: mapboxToken });

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  console.log('Usage: npm run mapbox:upload <command> [options]');
  console.log('\nCommands:');
  console.log('  venues          - Upload Dojo venue locations');
  console.log('  territories     - Upload territory boundaries');
  console.log('  players         - Upload player location data');
  console.log('  help            - Show this help message');
  console.log('\nExamples:');
  console.log('  npm run mapbox:upload venues');
  console.log(
    '  npm run mapbox:upload territories --file=./data/territories.geojson'
  );
  console.log('\nData Formats:');
  console.log('  - GeoJSON (.geojson) - Recommended for most data');
  console.log('  - KML (.kml) - For Google Earth compatibility');
  console.log('  - Shapefile (.shp) - For GIS professionals');
  process.exit(0);
}

async function uploadVenues() {
  console.log('🏠 Uploading Dojo venue locations...');

  try {
    // Example venue data structure
    const venuesData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'The Jade Tiger',
            type: 'dojo',
            controller: 'RyuKlaw',
            clan: 'Crimson Monkey',
            status: 'active',
          },
          geometry: {
            type: 'Point',
            coordinates: [153.0251, -27.4698], // Brisbane coordinates
          },
        },
      ],
    };

    console.log('✅ Venue data prepared');
    console.log('📝 Next: Use Mapbox Studio or API to create tilesets');
    console.log('🔗 Visit: https://studio.mapbox.com/');
  } catch (error) {
    console.error('❌ Error uploading venues:', error.message);
    process.exit(1);
  }
}

async function uploadTerritories() {
  console.log('🗺️  Uploading territory boundaries...');

  try {
    // Example territory data structure
    const territoriesData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Brisbane Central',
            controller: 'RyuKlaw',
            clan: 'Crimson Monkey',
            level: 5,
            income: 100,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [153.0151, -27.4798],
                [153.0351, -27.4798],
                [153.0351, -27.4598],
                [153.0151, -27.4598],
                [153.0151, -27.4798],
              ],
            ],
          },
        },
      ],
    };

    console.log('✅ Territory data prepared');
    console.log('📝 Next: Use Mapbox Studio or API to create tilesets');
    console.log('🔗 Visit: https://studio.mapbox.com/');
  } catch (error) {
    console.error('❌ Error uploading territories:', error.message);
    process.exit(1);
  }
}

async function uploadPlayers() {
  console.log('👥 Uploading player location data...');

  try {
    // Example player data structure
    const playersData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Julian',
            avatar: 'Warrior of Jade Tiger',
            clan: 'Crimson Monkey',
            level: 15,
            status: 'online',
          },
          geometry: {
            type: 'Point',
            coordinates: [153.0251, -27.4698],
          },
        },
      ],
    };

    console.log('✅ Player data prepared');
    console.log('📝 Next: Use Mapbox Studio or API to create tilesets');
    console.log('🔗 Visit: https://studio.mapbox.com/');
  } catch (error) {
    console.error('❌ Error uploading players:', error.message);
    process.exit(1);
  }
}

// Execute command
switch (command) {
  case 'venues':
    uploadVenues();
    break;
  case 'territories':
    uploadTerritories();
    break;
  case 'players':
    uploadPlayers();
    break;
  default:
    console.log(`❌ Unknown command: ${command}`);
    console.log('Run: npm run mapbox:upload help');
    process.exit(1);
}
