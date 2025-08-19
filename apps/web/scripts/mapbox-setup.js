#!/usr/bin/env node

/**
 * Mapbox CLI Setup Script
 * Configures Mapbox access tokens and validates setup
 */

const fs = require('fs');
const path = require('path');

console.log('🗺️  Mapbox CLI Setup for DojoPool\n');

// Check for environment variables
const mapboxToken =
  process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  console.log('❌ No Mapbox access token found!');
  console.log('\nTo set up Mapbox CLI, you need to:');
  console.log('\n1. Create a .env.local file in the apps/web directory with:');
  console.log('   NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_mapbox_token_here');
  console.log('   MAPBOX_ACCESS_TOKEN=your_actual_mapbox_token_here');
  console.log('\n2. Or set environment variables:');
  console.log('   Windows PowerShell: $env:MAPBOX_ACCESS_TOKEN="your_token"');
  console.log('   Windows CMD: set MAPBOX_ACCESS_TOKEN=your_token');
  console.log('   Linux/macOS: export MAPBOX_ACCESS_TOKEN="your_token"');
  console.log(
    '\n3. Get your token from: https://account.mapbox.com/access-tokens/'
  );
  process.exit(1);
}

if (mapboxToken === 'your_actual_mapbox_token_here') {
  console.log(
    '❌ Please replace the placeholder token with your actual Mapbox access token'
  );
  process.exit(1);
}

console.log('✅ Mapbox access token found');
console.log(
  `Token: ${mapboxToken.substring(0, 10)}...${mapboxToken.substring(
    mapboxToken.length - 4
  )}`
);

// Validate token format
if (!mapboxToken.startsWith('pk.') && !mapboxToken.startsWith('sk.')) {
  console.log(
    '⚠️  Warning: Token format looks unusual. Expected pk. or sk. prefix'
  );
}

console.log('\n🎯 Mapbox CLI is now configured!');
console.log('\nAvailable commands:');
console.log('  npm run mapbox:upload    - Upload data to Mapbox');
console.log('  npm run mapbox:tileset   - Manage tilesets');
console.log('  npm run mapbox:setup     - Re-run this setup');

console.log('\n📚 Next steps:');
console.log('1. Test your setup: npm run mapbox:upload --help');
console.log('2. Upload your first dataset');
console.log('3. Create custom map styles');
console.log('4. Integrate with your DojoPool World Hub Map');

console.log('\n�� Happy mapping!');
