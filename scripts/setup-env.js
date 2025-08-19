#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up local environment variables...');

const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

// Check if .env.local already exists
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local already exists. Skipping setup.');
  console.log(
    '💡 If you need to update Firebase config, run: npm run validate-firebase'
  );
  process.exit(0);
}

// Check if main .env exists
if (!fs.existsSync(envPath)) {
  console.error(
    '❌ .env file not found. Please ensure you have the main environment file.'
  );
  process.exit(1);
}

// Read the main .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract frontend variables
const frontendVars = [
  'VITE_NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_ENABLE_TOURNAMENTS',
  'NEXT_PUBLIC_ENABLE_MARKETPLACE',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_GOOGLE_MAPS_MAP_ID',
  'NODE_ENV',
  'VITE_API_URL',
  'VITE_WEBSOCKET_URL',
  'REACT_APP_WEBSOCKET_URL',
  'REACT_APP_WS_URL',
  'VITE_SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'VITE_3DAI_STUDIO_API_KEY',
];

// Create .env.local content
let envLocalContent = `# Frontend Environment Variables (Local Development)
# This file is gitignored and should be created locally by each developer

`;

// Extract and add frontend variables
const lines = envContent.split('\n');
for (const line of lines) {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key] = trimmedLine.split('=');
    if (frontendVars.includes(key)) {
      envLocalContent += line + '\n';
    }
  }
}

// Write .env.local file
fs.writeFileSync(envLocalPath, envLocalContent);

console.log('✅ .env.local created successfully!');
console.log('💡 You can now start the development server with: npm run dev');
console.log('🔍 To validate Firebase configuration: npm run validate-firebase');
