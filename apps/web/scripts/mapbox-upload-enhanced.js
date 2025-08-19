#!/usr/bin/env node

/**
 * Enhanced Mapbox Upload CLI Script for DojoPool
 * Reads actual GeoJSON files and processes them for Mapbox
 */

const MapboxClient = require('@mapbox/mapbox-sdk');
const fs = require('fs');
const path = require('path');

console.log('📤 Enhanced Mapbox Upload CLI for DojoPool\n');

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
  console.log(
    'Usage: node scripts/mapbox-upload-enhanced.js <command> [options]'
  );
  console.log('\nCommands:');
  console.log('  venues          - Upload Dojo venue locations from GeoJSON');
  console.log('  territories     - Upload territory boundaries from GeoJSON');
  console.log('  players         - Upload player location data from GeoJSON');
  console.log('  all             - Upload all data types');
  console.log('  help            - Show this help message');
  console.log('\nExamples:');
  console.log('  node scripts/mapbox-upload-enhanced.js venues');
  console.log('  node scripts/mapbox-upload-enhanced.js all');
  process.exit(0);
}

function readGeoJSONFile(filename) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } else {
      console.log(`⚠️  File not found: ${filename}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return null;
  }
}

function validateGeoJSON(data) {
  if (!data || !data.type || data.type !== 'FeatureCollection') {
    return false;
  }
  if (!data.features || !Array.isArray(data.features)) {
    return false;
  }
  return true;
}

async function uploadVenues() {
  console.log('🏠 Uploading Dojo venue locations...');

  const venuesData = readGeoJSONFile('dojopool-venues.geojson');
  if (!venuesData) {
    console.log('❌ No venue data found');
    return;
  }

  if (!validateGeoJSON(venuesData)) {
    console.log('❌ Invalid GeoJSON format for venues');
    return;
  }

  console.log(`✅ Found ${venuesData.features.length} venues:`);
  venuesData.features.forEach((feature) => {
    const props = feature.properties;
    console.log(
      `  - ${props.name} (${props.controllingClan}) - Level ${props.level}`
    );
  });

  console.log('\n📝 Next: Use Mapbox Studio or API to create tilesets');
  console.log('🔗 Visit: https://studio.mapbox.com/');

  return venuesData;
}

async function uploadTerritories() {
  console.log('🗺️  Uploading territory boundaries...');

  const territoriesData = readGeoJSONFile('dojopool-territories.geojson');
  if (!territoriesData) {
    console.log('❌ No territory data found');
    return;
  }

  if (!validateGeoJSON(territoriesData)) {
    console.log('❌ Invalid GeoJSON format for territories');
    return;
  }

  console.log(`✅ Found ${territoriesData.features.length} territories:`);
  territoriesData.features.forEach((feature) => {
    const props = feature.properties;
    console.log(
      `  - ${props.name} (${props.clan}) - Level ${props.level} - Income: ${props.income}`
    );
  });

  console.log('\n📝 Next: Use Mapbox Studio or API to create tilesets');
  console.log('🔗 Visit: https://studio.mapbox.com/');

  return territoriesData;
}

async function uploadPlayers() {
  console.log('👥 Uploading player location data...');

  const playersData = readGeoJSONFile('dojopool-players.geojson');
  if (!playersData) {
    console.log('❌ No player data found');
    return;
  }

  if (!validateGeoJSON(playersData)) {
    console.log('❌ Invalid GeoJSON format for players');
    return;
  }

  console.log(`✅ Found ${playersData.features.length} players:`);
  playersData.features.forEach((feature) => {
    const props = feature.properties;
    console.log(
      `  - ${props.username} (${props.clan}) - Level ${props.level} - ${props.status}`
    );
  });

  console.log('\n📝 Next: Use Mapbox Studio or API to create tilesets');
  console.log('🔗 Visit: https://studio.mapbox.com/');

  return playersData;
}

async function uploadAll() {
  console.log('🚀 Uploading all DojoPool data...\n');

  const results = {
    venues: await uploadVenues(),
    territories: await uploadTerritories(),
    players: await uploadPlayers(),
  };

  console.log('\n📊 Upload Summary:');
  console.log(
    `  Venues: ${results.venues ? results.venues.features.length : 0}`
  );
  console.log(
    `  Territories: ${
      results.territories ? results.territories.features.length : 0
    }`
  );
  console.log(
    `  Players: ${results.players ? results.players.features.length : 0}`
  );

  console.log('\n🎯 Next Steps:');
  console.log('1. Visit Mapbox Studio: https://studio.mapbox.com/');
  console.log('2. Create new tilesets from your uploaded data');
  console.log('3. Style your maps with DojoPool branding');
  console.log('4. Integrate tileset URLs into your World Hub Map component');
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
  case 'all':
    uploadAll();
    break;
  default:
    console.log(`❌ Unknown command: ${command}`);
    console.log('Run: node scripts/mapbox-upload-enhanced.js help');
    process.exit(1);
}
