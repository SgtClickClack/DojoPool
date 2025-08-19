async function testVenueCustomization() {
  try {
    console.log('Testing Venue Customization API...');

    // Test data for venue customization
    const testOptions = {
      venueName: 'The Golden Cue',
      location: 'Brisbane, Australia',
      venueType: 'pool_hall',
      atmosphere: 'competitive',
      targetAudience: 'tournament_players',
      specialFeatures: ['Professional tables', 'Tournament space'],
    };

    console.log('Test options:', JSON.stringify(testOptions, null, 2));

    // Test the preview endpoint
    console.log('\n1. Testing preview endpoint...');
    const previewResponse = await fetch(
      'http://localhost:8080/api/venue-customization/preview',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testOptions),
      }
    );

    if (previewResponse.ok) {
      const previewData = await previewResponse.json();
      console.log('✅ Preview endpoint working!');
      console.log(
        'Generated customization:',
        JSON.stringify(previewData.customization, null, 2)
      );
    } else {
      console.log(
        '❌ Preview endpoint failed:',
        previewResponse.status,
        previewResponse.statusText
      );
    }

    // Test the health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:8080/api/health');

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working!');
      console.log('Health data:', healthData);
    } else {
      console.log(
        '❌ Health endpoint failed:',
        healthResponse.status,
        healthResponse.statusText
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the server is running on port 8080');
  }
}

// Run the test
testVenueCustomization();
