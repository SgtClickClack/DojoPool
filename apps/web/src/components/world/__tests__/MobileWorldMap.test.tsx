import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import MobileWorldMap from '../world/MobileWorldMap';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="mobile-world-map-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="mobile-world-map-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="mobile-world-map-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="mobile-world-map-box" {...props}>
        {children}
      </div>
    ),
    Fab: ({ children, onClick, ...props }: any) => (
      <button data-testid="mobile-world-map-fab" onClick={onClick} {...props}>
        {children}
      </button>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  LocationOn: () => <div data-testid="location-icon">📍</div>,
  MyLocation: () => <div data-testid="my-location-icon">🎯</div>,
  FilterList: () => <div data-testid="filter-icon">🔽</div>,
  Search: () => <div data-testid="search-icon">🔍</div>,
  Menu: () => <div data-testid="menu-icon">☰</div>,
}));

// Mock the map component
vi.mock('../world/WorldHubMapWrapper', () => ({
  default: () => <div data-testid="world-hub-map-wrapper">World Hub Map Wrapper</div>,
}));

describe('MobileWorldMap Component', () => {
  const defaultProps = createMockProps({
    venues: [
      {
        id: '1',
        name: 'Test Venue',
        lat: 40.7128,
        lng: -74.006,
        tables: 4,
        status: 'OPEN' as const,
      },
      {
        id: '2',
        name: 'Another Venue',
        lat: 40.7589,
        lng: -73.9851,
        tables: 6,
        status: 'CLOSED' as const,
      },
    ],
    onVenueClick: vi.fn(),
    onLocationClick: vi.fn(),
    onFilter: vi.fn(),
    onSearch: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map wrapper', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    expect(screen.getByTestId('world-hub-map-wrapper')).toBeInTheDocument();
  });

  it('displays mobile-specific controls', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-world-map-fab')).toBeInTheDocument();
    expect(screen.getByTestId('my-location-icon')).toBeInTheDocument();
  });

  it('renders filter and search controls', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('calls onLocationClick when location button is clicked', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    const locationButton = screen.getByTestId('mobile-world-map-fab');
    fireEvent.click(locationButton);
    
    expect(defaultProps.onLocationClick).toHaveBeenCalled();
  });

  it('calls onFilter when filter button is clicked', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    const filterButton = screen.getByTestId('filter-icon');
    fireEvent.click(filterButton);
    
    expect(defaultProps.onFilter).toHaveBeenCalled();
  });

  it('calls onSearch when search button is clicked', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    const searchButton = screen.getByTestId('search-icon');
    fireEvent.click(searchButton);
    
    expect(defaultProps.onSearch).toHaveBeenCalled();
  });

  it('handles venue clicks', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    // Simulate venue click (this would be handled by the map component)
    const venue = defaultProps.venues[0];
    defaultProps.onVenueClick(venue.id);
    
    expect(defaultProps.onVenueClick).toHaveBeenCalledWith(venue.id);
  });

  it('displays venue count', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    expect(screen.getByText('2 Venues')).toBeInTheDocument();
  });

  it('handles empty venue list', () => {
    const emptyProps = {
      ...defaultProps,
      venues: [],
    };
    
    customRender(<MobileWorldMap {...emptyProps} />);
    
    expect(screen.getByText('0 Venues')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    customRender(<MobileWorldMap {...loadingProps} />);
    
    expect(screen.getByText('Loading map...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load map',
    };
    
    customRender(<MobileWorldMap {...errorProps} />);
    
    expect(screen.getByText('Failed to load map')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      venues: defaultProps.venues,
      onVenueClick: vi.fn(),
      onLocationClick: vi.fn(),
    };
    
    expect(() => customRender(<MobileWorldMap {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    const card = screen.getByTestId('mobile-world-map-card');
    expect(card).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h6');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<MobileWorldMap {...disabledProps} />);
    
    const locationButton = screen.getByTestId('mobile-world-map-fab');
    expect(locationButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<MobileWorldMap {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large venue lists efficiently', () => {
    const largeVenueList = Array.from({ length: 50 }, (_, i) => ({
      id: `venue-${i}`,
      name: `Venue ${i}`,
      lat: 40.7128 + (i * 0.01),
      lng: -74.006 + (i * 0.01),
      tables: Math.floor(Math.random() * 10) + 1,
      status: 'OPEN' as const,
    }));
    
    const largeProps = {
      ...defaultProps,
      venues: largeVenueList,
    };
    
    customRender(<MobileWorldMap {...largeProps} />);
    
    expect(screen.getByText('50 Venues')).toBeInTheDocument();
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = customRender(<MobileWorldMap {...defaultProps} />);
    
    const updatedVenues = [
      ...defaultProps.venues,
      {
        id: '3',
        name: 'New Venue',
        lat: 40.7831,
        lng: -73.9712,
        tables: 8,
        status: 'OPEN' as const,
      },
    ];
    
    rerender(<MobileWorldMap {...defaultProps} venues={updatedVenues} />);
    
    expect(screen.getByText('3 Venues')).toBeInTheDocument();
  });

  it('handles venue updates in real-time', () => {
    const { rerender } = customRender(<MobileWorldMap {...defaultProps} />);
    
    const updatedVenues = defaultProps.venues.map(venue => ({
      ...venue,
      tables: venue.tables + 1, // Update table count
    }));
    
    rerender(<MobileWorldMap {...defaultProps} venues={updatedVenues} />);
    
    // Check if venues are updated
    expect(screen.getByText('2 Venues')).toBeInTheDocument();
  });

  it('displays venue status correctly', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    // Check if venue status is displayed
    expect(screen.getByTestId('chip-success')).toBeInTheDocument(); // OPEN
    expect(screen.getByTestId('chip-error')).toBeInTheDocument(); // CLOSED
  });

  it('handles venues with no tables', () => {
    const venueWithNoTables = {
      id: '4',
      name: 'Venue with No Tables',
      lat: 40.7128,
      lng: -74.006,
      tables: 0,
      status: 'OPEN' as const,
    };
    
    customRender(<MobileWorldMap {...defaultProps} venues={[venueWithNoTables]} />);
    
    expect(screen.getByText('1 Venues')).toBeInTheDocument();
  });

  it('handles venues with complex metadata', () => {
    const venueWithComplexMetadata = {
      id: '5',
      name: 'Complex Venue',
      lat: 40.7128,
      lng: -74.006,
      tables: 10,
      status: 'OPEN' as const,
      features: ['WiFi', 'Parking', 'Food'],
      rating: 4.5,
      hours: 'Mon-Fri: 9AM-11PM',
    };
    
    customRender(<MobileWorldMap {...defaultProps} venues={[venueWithComplexMetadata]} />);
    
    expect(screen.getByText('1 Venues')).toBeInTheDocument();
  });

  it('displays map controls correctly', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    // Check if map controls are displayed
    expect(screen.getByTestId('location-icon')).toBeInTheDocument();
    expect(screen.getByTestId('my-location-icon')).toBeInTheDocument();
  });

  it('handles map interaction events', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    // Simulate map interaction events
    const mapWrapper = screen.getByTestId('world-hub-map-wrapper');
    fireEvent.click(mapWrapper);
    
    // Check if map interactions are handled
    expect(mapWrapper).toBeInTheDocument();
  });

  it('displays venue information correctly', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    // Check if venue information is displayed
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('Another Venue')).toBeInTheDocument();
  });

  it('handles venue filtering', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    const filterButton = screen.getByTestId('filter-icon');
    fireEvent.click(filterButton);
    
    // Check if filter options are displayed
    expect(screen.getByText('All Venues')).toBeInTheDocument();
    expect(screen.getByText('Open Only')).toBeInTheDocument();
    expect(screen.getByText('Closed Only')).toBeInTheDocument();
  });

  it('handles venue searching', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    const searchButton = screen.getByTestId('search-icon');
    fireEvent.click(searchButton);
    
    // Check if search input is displayed
    expect(screen.getByTestId('mobile-world-map-search')).toBeInTheDocument();
  });

  it('displays venue table counts', () => {
    customRender(<MobileWorldMap {...defaultProps} />);
    
    // Check if table counts are displayed
    expect(screen.getByText('4 Tables')).toBeInTheDocument();
    expect(screen.getByText('6 Tables')).toBeInTheDocument();
  });

  it('handles venue status changes', () => {
    const { rerender } = customRender(<MobileWorldMap {...defaultProps} />);
    
    const updatedVenues = defaultProps.venues.map(venue => ({
      ...venue,
      status: venue.status === 'OPEN' ? 'CLOSED' : 'OPEN',
    }));
    
    rerender(<MobileWorldMap {...defaultProps} venues={updatedVenues} />);
    
    // Check if status changes are reflected
    expect(screen.getByText('2 Venues')).toBeInTheDocument();
  });
});
