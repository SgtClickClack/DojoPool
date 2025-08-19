// Simple test to verify the Dojo Tier implementation
const {
  enhancedVenueManagementService,
} = require('./src/services/venue/EnhancedVenueManagementService.ts');

async function testTierImplementation() {
  try {
    console.log('Testing Dojo Tier Implementation...');

    // Test getting venue by ID
    const venue = await enhancedVenueManagementService.getVenue('venue-1');

    if (venue) {
      console.log('✓ Venue retrieved successfully');
      console.log(`  - ID: ${venue.id}`);
      console.log(`  - Name: ${venue.name}`);
      console.log(`  - Tier: ${venue.tier}`);

      if (venue.tier === 'Gold') {
        console.log('✓ Tier property is correctly set to Gold');
      } else {
        console.log('✗ Tier property is not set correctly');
      }
    } else {
      console.log('✗ Failed to retrieve venue');
    }

    // Test getting second venue
    const venue2 = await enhancedVenueManagementService.getVenue('venue-2');

    if (venue2) {
      console.log('✓ Second venue retrieved successfully');
      console.log(`  - ID: ${venue2.id}`);
      console.log(`  - Name: ${venue2.name}`);
      console.log(`  - Tier: ${venue2.tier}`);

      if (venue2.tier === 'Silver') {
        console.log('✓ Second venue tier property is correctly set to Silver');
      } else {
        console.log('✗ Second venue tier property is not set correctly');
      }
    } else {
      console.log('✗ Failed to retrieve second venue');
    }

    console.log('\nDojo Tier Implementation Test Complete!');
  } catch (error) {
    console.error('Error testing implementation:', error);
  }
}

testTierImplementation();
