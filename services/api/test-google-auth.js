/**
 * Test script to verify Google OAuth configuration
 * Run with: node test-google-auth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Google OAuth Configuration Test\n');

// Check for .env file
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env file not found at:', envPath);
  console.log('   Please create a .env file with your Google OAuth credentials.');
  console.log('   See GOOGLE_OAUTH_SETUP.md for instructions.\n');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

// Check required OAuth variables
const requiredVars = [
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_REDIRECT_URI',
  'FRONTEND_URL',
  'JWT_SECRET',
  'DATABASE_URL'
];

console.log('📋 Checking environment variables:');
let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : value.substring(0, 30) + '...'}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  }
});

console.log('\n📍 Configuration Details:');
console.log(`   API Port: ${process.env.PORT || 3002}`);
console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
console.log(`   Redirect URI: ${process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3002/api/v1/auth/google/callback'}`);

if (!allPresent) {
  console.log('\n⚠️  Some required environment variables are missing.');
  console.log('   Please update your .env file with all required values.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');
console.log('\n🌐 Google OAuth URLs:');
console.log(`   Login URL: http://localhost:${process.env.PORT || 3002}/api/v1/auth/google`);
console.log(`   Callback URL: ${process.env.GOOGLE_OAUTH_REDIRECT_URI}`);

console.log('\n📝 Next Steps:');
console.log('1. Make sure your Google OAuth client has the redirect URI configured exactly as shown above');
console.log('2. Start the backend: npm run start:dev');
console.log('3. Start the frontend: npm run dev (in apps/web directory)');
console.log('4. Navigate to http://localhost:3000/login');
console.log('5. Click "Sign in with Google"');

console.log('\n🔧 If you encounter issues:');
console.log('- Check that the redirect URI matches exactly in Google Cloud Console');
console.log('- Ensure both frontend and backend are running');
console.log('- Check browser console and backend logs for error messages');
console.log('- Verify your Client ID and Secret are correct');
