import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '@/theme';
import GameMap from '../GameMap';

// Mock the Google Maps JavaScript API
jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GoogleMap: ({ children }: { children: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  Circle: () => <div data-testid="player-range-circle" />,
}));

// Mock the google.maps namespace
const mockLatLng = jest.fn();
const mockMarker = jest.fn();
const mockMap = jest.fn();
const mockBounds = jest.fn(() => ({
  extend: jest.fn(),
}));

global.google = {
  maps: {
    LatLng: mockLatLng,
    Marker: mockMarker,
    Map: mockMap,
    LatLngBounds: mockBounds,
    SymbolPath: {
      CIRCLE: 0,
    },
  },
} as any;

describe('GameMap', () => {
  const defaultProps = {
    currentLocation: {
      latitude: 51.5074,
      longitude: -0.1278,
    },
    otherPlayerLocations: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <ThemeProvider theme={theme}>
        <GameMap {...defaultProps} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getByTestId('player-range-circle')).toBeInTheDocument();
  });

  it('creates markers for other players', () => {
    const otherPlayerLocations = {
      player1: { latitude: 51.5080, longitude: -0.1280 },
      player2: { latitude: 51.5090, longitude: -0.1290 },
    };

    render(
      <ThemeProvider theme={theme}>
        <GameMap {...defaultProps} otherPlayerLocations={otherPlayerLocations} />
      </ThemeProvider>
    );

    // Should create 3 markers (1 for current player + 2 for other players)
    expect(mockMarker).toHaveBeenCalledTimes(3);
  });

  it('updates marker positions when locations change', () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <GameMap {...defaultProps} />
      </ThemeProvider>
    );

    const newLocation = {
      latitude: 51.5080,
      longitude: -0.1280,
    };

    rerender(
      <ThemeProvider theme={theme}>
        <GameMap {...defaultProps} currentLocation={newLocation} />
      </ThemeProvider>
    );

    // Should create new LatLng for the updated position
    expect(mockLatLng).toHaveBeenCalledWith(newLocation.latitude, newLocation.longitude);
  });

  it('cleans up markers on unmount', () => {
    const mockSetMap = jest.fn();
    mockMarker.mockImplementation(() => ({
      setMap: mockSetMap,
    }));

    const { unmount } = render(
      <ThemeProvider theme={theme}>
        <GameMap {...defaultProps} />
      </ThemeProvider>
    );

    unmount();

    // Should remove marker from map
    expect(mockSetMap).toHaveBeenCalledWith(null);
  });
}); 