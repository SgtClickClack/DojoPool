import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import getGoogleMapsApiKey from '../../../apps/web/src/utils/getGoogleMapsApiKey';

const MapTest: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: getGoogleMapsApiKey(),
  });

  console.log(
    'MapTest - API Key exists:',
    !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
  console.log(
    'MapTest - API Key value:',
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...'
  );
  console.log('MapTest - Loading status:', { isLoaded, loadError });

  if (loadError) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Google Maps Load Error:</h2>
        <p>{loadError.message}</p>
        <p>Stack: {loadError.stack}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Loading Google Maps API...</h2>
        <p>
          API Key present:{' '}
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', color: 'green' }}>
      <h2>✅ Google Maps API Loaded Successfully!</h2>
      <p>Ready to render map components.</p>
    </div>
  );
};

export default MapTest;
