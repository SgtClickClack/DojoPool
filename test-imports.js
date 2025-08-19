// Test script to validate backend imports individually
console.log('Testing backend imports...');

const imports = [
  'express',
  'path',
  '../config/monitoring.ts',
  'express-rate-limit',
  'express-validator',
  'helmet',
  'dotenv',
  'http',
  'socket.io',
  'cors',
  'http-proxy-middleware',
  './routes/social.ts',
  './routes/territory.ts',
  './routes/userNfts.ts',
  './routes/challenge.ts',
  './routes/tournament.ts',
  './routes/passive-income.ts',
  './routes/enhanced-social.ts',
  './routes/advanced-tournament.ts',
  './routes/advanced-player-analytics.ts',
  './routes/advanced-venue-management.ts',
  './routes/advanced-social-community.ts',
  './routes/investor-auth.ts',
  './routes/venue-customization.ts',
  './routes/venue-leaderboard.ts',
  '../services/venue/VenueLeaderboardService.ts',
  './routes/advanced-analytics.ts',
  '../services/analytics/AdvancedAnalyticsService.ts',
  './routes/highlights.ts',
  './routes/dojo.ts',
  './routes/challenge-phase4.ts',
  './routes/player.ts',
  './routes/match-tracking.ts',
  './routes/texture-ai.ts',
  './routes/venue-management.ts',
];

async function testImports() {
  for (const importPath of imports) {
    try {
      console.log(`Testing import: ${importPath}`);
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Relative import - need to resolve from src/backend
        const fullPath = importPath.startsWith('./')
          ? `./src/backend/${importPath.slice(2)}`
          : `./src/${importPath.slice(3)}`;
        await import(fullPath);
      } else {
        // Node module
        await import(importPath);
      }
      console.log(`✓ ${importPath} - OK`);
    } catch (error) {
      console.error(`✗ ${importPath} - ERROR:`, error.message);
      return; // Stop on first error
    }
  }
  console.log('All imports tested successfully!');
}

testImports().catch(console.error);
