/**
 * Mapbox Configuration for DojoPool
 *
 * To use this file:
 * 1. Replace 'your_actual_mapbox_token_here' with your real Mapbox token
 * 2. Run: node mapbox-config.js
 * 3. Copy the environment variable commands to your terminal
 */

const fs = require('fs');
const path = require('path');

console.log('🗺️  Mapbox Configuration Setup for DojoPool\n');

// Your Mapbox token - REPLACE THIS WITH YOUR ACTUAL TOKEN
const MAPBOX_TOKEN = 'your_actual_mapbox_token_here';

if (MAPBOX_TOKEN === 'your_actual_mapbox_token_here') {
  console.log(
    '❌ Please edit this file and replace "your_actual_mapbox_token_here" with your real Mapbox token'
  );
  console.log('\nTo get your token:');
  console.log('1. Visit: https://account.mapbox.com/access-tokens/');
  console.log('2. Create a new token or copy your existing one');
  console.log('3. Replace the placeholder in this file');
  console.log('4. Run this script again');
  process.exit(1);
}

console.log('✅ Mapbox token configured');
console.log(
  `Token: ${MAPBOX_TOKEN.substring(0, 10)}...${MAPBOX_TOKEN.substring(
    MAPBOX_TOKEN.length - 4
  )}`
);

// Validate token format
if (!MAPBOX_TOKEN.startsWith('pk.') && !MAPBOX_TOKEN.startsWith('sk.')) {
  console.log(
    '⚠️  Warning: Token format looks unusual. Expected pk. or sk. prefix'
  );
}

console.log('\n📋 Environment Variable Commands:');
console.log('\nWindows PowerShell:');
console.log(`$env:MAPBOX_ACCESS_TOKEN="${MAPBOX_TOKEN}"`);
console.log(`$env:NEXT_PUBLIC_MAPBOX_TOKEN="${MAPBOX_TOKEN}"`);

console.log('\nWindows Command Prompt:');
console.log(`set MAPBOX_ACCESS_TOKEN=${MAPBOX_TOKEN}`);
console.log(`set NEXT_PUBLIC_MAPBOX_TOKEN=${MAPBOX_TOKEN}`);

console.log('\nLinux/macOS:');
console.log(`export MAPBOX_ACCESS_TOKEN="${MAPBOX_TOKEN}"`);
console.log(`export NEXT_PUBLIC_MAPBOX_TOKEN="${MAPBOX_TOKEN}"`);

console.log('\n📁 Create .env.local file:');
console.log('Create a file named .env.local in the apps/web directory with:');
console.log(`NEXT_PUBLIC_MAPBOX_TOKEN=${MAPBOX_TOKEN}`);
console.log(`MAPBOX_ACCESS_TOKEN=${MAPBOX_TOKEN}`);

console.log('\n🎯 Next Steps:');
console.log('1. Set the environment variables using one of the commands above');
console.log('2. Test the setup: npm run mapbox:setup');
console.log('3. Use the CLI tools: npm run mapbox:upload venues');
console.log('4. Start your development server to see the map in action');

console.log('\n�� Happy mapping!');
