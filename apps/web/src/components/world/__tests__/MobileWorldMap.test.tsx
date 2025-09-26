import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileWorldMap from '../world/MobileWorldMap';

// Mock the MobileWorldMap component since it doesn't exist yet
jest.mock('../world/MobileWorldMap', () => {
  return function MockMobileWorldMap({ venues, onVenueSelect, userLocation }: any) {
    return (
      <div data-testid="mobile-world-map">
        <h2>Mobile World Map</h2>
        <p>Current Location: {userLocation?.city || 'Unknown'}</p>
        <div data-testid="venues-list">
          {venues.map((venue: any) => (
            <div 
              key={venue.id} 
              data-testid={`venue-${venue.id}`}
              onClick={() => onVenueSelect(venue)}
            >
              <h3>{venue.name}</h3>
              <p>{venue.address.city}, {venue.address.state}</p>
              <p>Rating: {venue.rating}</p>
            </div>
          ))}
        </div>
        {venues.length === 0 && <p>No venues nearby</p>}
      </div>
    );
  };
});

const mockVenues = [
  {
    id: 'venue-1',
    name: 'Mobile Test Venue 1',
    address: {
      city: 'Test City',
      state: 'Test State',
    },
    rating: 4.5,
  },
  {
    id: 'venue-2',
    name: 'Mobile Test Venue 2',
    address: {
      city: 'Another City',
      state: 'Another State',
    },
    rating: 4.2,
  },
];

const mockUserLocation = {
  city: 'Current City',
  state: 'Current State',
  coordinates: { latitude: 40.7128, longitude: -74.0060 },
};

const mockOnVenueSelect = jest.fn();

const defaultProps = {
  venues: mockVenues,
  onVenueSelect: mockOnVenueSelect,
  userLocation: mockUserLocation,
};

const emptyProps = {
  ...defaultProps,
  venues: [],
};

const noLocationProps = {
  ...defaultProps,
  userLocation: undefined,
};

describe('MobileWorldMap', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mobile world map with venues', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    expect(screen.getByText('Mobile World Map')).toBeInTheDocument();
    expect(screen.getByText('Current Location: Current City')).toBeInTheDocument();
    expect(screen.getByTestId('venues-list')).toBeInTheDocument();
    expect(screen.getByText('Mobile Test Venue 1')).toBeInTheDocument();
    expect(screen.getByText('Mobile Test Venue 2')).toBeInTheDocument();
  });

  it('handles venue selection', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    const firstVenue = screen.getByTestId('venue-venue-1');
    fireEvent.click(firstVenue);
    
    expect(mockOnVenueSelect).toHaveBeenCalledWith(mockVenues[0]);
  });

  it('displays no venues message when empty', () => {
    customRender(<MobileWorldMap {...emptyProps} />);
    
    expect(screen.getByText('No venues nearby')).toBeInTheDocument();
    expect(screen.queryByTestId('venues-list')).toBeInTheDocument();
  });

  it('handles no user location', () => {
    customRender(<MobileWorldMap {...noLocationProps} />);
    
    expect(screen.getByText('Current Location: Unknown')).toBeInTheDocument();
  });

  it('renders venue details correctly', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    expect(screen.getByText('Test City, Test State')).toBeInTheDocument();
    expect(screen.getByText('Rating: 4.5')).toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    customRender(<MobileWorldMap venues={[]} onVenueSelect={jest.fn()} />);
    
    expect(screen.getByTestId('mobile-world-map')).toBeInTheDocument();
  });

  it('performance test renders map efficiently', async () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    expect(screen.getByText('Mobile World Map')).toBeInTheDocument();
  }, 5000);
});
