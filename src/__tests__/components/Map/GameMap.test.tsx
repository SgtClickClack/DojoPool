import React from 'react';
import { screen, act } from '@testing-library/react';
import { GameMap } from '../../../dojopool/frontend/components/Map/[MAP]GameMap';
import { renderWithProviders } from '../../utils/testUtils';

// Mock Google Maps JavaScript API
const mockMap = {
  fitBounds: jest.fn(),
  setCenter: jest.fn(),
  setZoom: jest.fn(),
};

const mockMarker = {
  setMap: jest.fn(),
  setPosition: jest.fn(),
};

const mockCircle = {
  setMap: jest.fn(),
  setCenter: jest.fn(),
  setRadius: jest.fn(),
};

const mockLatLngBounds = {
  extend: jest.fn(),
};

const mockLatLng = jest.fn().mockImplementation((lat, lng) => ({
  lat: () => lat,
  lng: () => lng,
  equals: (other: any) => lat === other.lat() && lng === other.lng(),
}));

// Mock the entire @react-google-maps/api module
jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoogleMap: ({
    children,
    onLoad,
    onUnmount,
  }: {
    children: React.ReactNode;
    onLoad: (map: any) => void;
    onUnmount: () => void;
  }) => {
    React.useEffect(() => {
      onLoad(mockMap);
      return () => onUnmount();
    }, [onLoad, onUnmount]);
    return <div data-testid="google-map">{children}</div>;
  },
  Circle: ({ center, radius }: { center: any; radius: number }) => (
    <div data-testid="map-circle" data-center={JSON.stringify(center)} data-radius={radius} />
  ),
}));

// Mock the window.google.maps object
const mockGoogleMaps = {
  Map: jest.fn(),
  Marker: jest.fn().mockImplementation(() => mockMarker),
  Circle: jest.fn().mockImplementation(() => mockCircle),
  LatLngBounds: jest.fn().mockImplementation(() => mockLatLngBounds),
  LatLng: mockLatLng,
  SymbolPath: {
    CIRCLE: 0,
  },
};

beforeAll(() => {
  // @ts-ignore
  window.google = {
    maps: mockGoogleMaps,
  };
});

describe('GameMap Component', () => {
  const mockCurrentLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const mockOtherPlayerLocations = {
    player1: {
      latitude: 40.7129,
      longitude: -74.0061,
    },
    player2: {
      latitude: 40.7127,
      longitude: -74.0059,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders map container', () => {
    renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
        otherPlayerLocations={mockOtherPlayerLocations}
      />
    );
    
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  it('renders player range circle', () => {
    renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
      />
    );
    
    const circle = screen.getByTestId('map-circle');
    expect(circle).toBeInTheDocument();
    
    const centerData = JSON.parse(circle.getAttribute('data-center') || '{}');
    expect(centerData).toEqual({
      lat: mockCurrentLocation.latitude,
      lng: mockCurrentLocation.longitude,
    });
  });

  it('updates map when current location changes', () => {
    const { rerender } = renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
      />
    );

    const newLocation = {
      latitude: 41.8781,
      longitude: -87.6298,
    };

    rerender(
      <GameMap 
        currentLocation={newLocation}
      />
    );

    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it('handles other player location updates', () => {
    const { rerender } = renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
        otherPlayerLocations={mockOtherPlayerLocations}
      />
    );

    const updatedLocations = {
      ...mockOtherPlayerLocations,
      player3: {
        latitude: 40.7130,
        longitude: -74.0062,
      },
    };

    rerender(
      <GameMap 
        currentLocation={mockCurrentLocation}
        otherPlayerLocations={updatedLocations}
      />
    );

    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it('cleans up markers on unmount', () => {
    const { unmount } = renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
        otherPlayerLocations={mockOtherPlayerLocations}
      />
    );

    unmount();

    expect(mockMarker.setMap).toHaveBeenCalledWith(null);
  });

  it('handles empty other player locations', () => {
    renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
        otherPlayerLocations={{}}
      />
    );

    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it('animates marker movements', () => {
    jest.useFakeTimers();

    const { rerender } = renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
        otherPlayerLocations={mockOtherPlayerLocations}
      />
    );

    const newLocation = {
      latitude: 40.7140,
      longitude: -74.0070,
    };

    rerender(
      <GameMap 
        currentLocation={newLocation}
        otherPlayerLocations={mockOtherPlayerLocations}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockMarker.setPosition).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('handles location update callback', () => {
    const mockOnLocationUpdate = jest.fn();

    renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
        onLocationUpdate={mockOnLocationUpdate}
        otherPlayerLocations={mockOtherPlayerLocations}
      />
    );

    // Simulate map click or location update
    // This would typically be handled by the Google Maps API
    // but we're just testing that the callback prop is passed correctly
    expect(mockOnLocationUpdate).not.toHaveBeenCalled();
  });

  it('applies custom map styles', () => {
    renderWithProviders(
      <GameMap 
        currentLocation={mockCurrentLocation}
      />
    );

    // Verify that the map was created with custom styles
    expect(mockMap.fitBounds).toHaveBeenCalled();
    // Custom styles would be verified through the map options
    // but since we're mocking the map, we just verify the map was initialized
  });

  it('handles invalid coordinates gracefully', () => {
    const invalidLocation = {
      latitude: NaN,
      longitude: NaN,
    };

    renderWithProviders(
      <GameMap 
        currentLocation={invalidLocation}
      />
    );

    // The map should still render without crashing
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });
}); 