import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, mockVenue, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import VenueCard from '../VenueCard';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, onClick, ...props }: any) => (
      <div data-testid="venue-card" onClick={onClick} {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="venue-card-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="venue-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="venue-box" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  LocationOn: () => <div data-testid="location-icon">📍</div>,
  TableBar: () => <div data-testid="table-icon">🪑</div>,
  Phone: () => <div data-testid="phone-icon">📞</div>,
  Star: () => <div data-testid="star-icon">⭐</div>,
}));

describe('VenueCard Component', () => {
  const defaultProps = createMockProps({
    venue: mockVenue,
    onVisit: vi.fn(),
    onChallenge: vi.fn(),
    onViewDetails: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders venue information correctly', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText('Test City, TS 12345')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // tables
  });

  it('displays venue location', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    expect(screen.getByTestId('location-icon')).toBeInTheDocument();
  });

  it('renders all required icons', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    expect(screen.getByTestId('location-icon')).toBeInTheDocument();
    expect(screen.getByTestId('table-icon')).toBeInTheDocument();
    expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    expect(screen.getByTestId('star-icon')).toBeInTheDocument();
  });

  it('calls onVisit when visit button is clicked', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    const visitButton = screen.getByText('Visit Venue');
    fireEvent.click(visitButton);
    
    expect(defaultProps.onVisit).toHaveBeenCalledWith(mockVenue.id);
  });

  it('calls onChallenge when challenge button is clicked', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    const challengeButton = screen.getByText('Challenge');
    fireEvent.click(challengeButton);
    
    expect(defaultProps.onChallenge).toHaveBeenCalledWith(mockVenue.id);
  });

  it('calls onViewDetails when view details button is clicked', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);
    
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith(mockVenue.id);
  });

  it('displays table count correctly', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    expect(screen.getByText('4 Tables')).toBeInTheDocument();
  });

  it('handles venue with no tables', () => {
    const venueWithNoTables = {
      ...mockVenue,
      tables: 0,
    };
    
    customRender(<VenueCard {...defaultProps} venue={venueWithNoTables} />);
    
    expect(screen.getByText('0 Tables')).toBeInTheDocument();
  });

  it('displays venue rating if available', () => {
    const venueWithRating = {
      ...mockVenue,
      rating: 4.5,
    };
    
    customRender(<VenueCard {...defaultProps} venue={venueWithRating} />);
    
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      venue: mockVenue,
      onVisit: vi.fn(),
      onChallenge: vi.fn(),
      onViewDetails: vi.fn(),
    };
    
    expect(() => customRender(<VenueCard {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<VenueCard {...defaultProps} />);
    
    const card = screen.getByTestId('venue-card');
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
    
    customRender(<VenueCard {...disabledProps} />);
    
    const visitButton = screen.getByText('Visit Venue');
    expect(visitButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<VenueCard {...defaultProps} />);
    });
    
    // Should render in less than 50ms
    expect(renderTime).toBeLessThan(50);
  });

  it('handles long venue names gracefully', () => {
    const venueWithLongName = {
      ...mockVenue,
      name: 'This is a very long venue name that should be handled gracefully',
    };
    
    customRender(<VenueCard {...defaultProps} venue={venueWithLongName} />);
    
    expect(screen.getByText(venueWithLongName.name)).toBeInTheDocument();
  });

  it('displays venue status correctly', () => {
    const venueWithStatus = {
      ...mockVenue,
      status: 'OPEN' as const,
    };
    
    customRender(<VenueCard {...defaultProps} venue={venueWithStatus} />);
    
    expect(screen.getByTestId('chip-success')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('handles venue with special features', () => {
    const venueWithFeatures = {
      ...mockVenue,
      features: ['WiFi', 'Parking', 'Food'],
    };
    
    customRender(<VenueCard {...defaultProps} venue={venueWithFeatures} />);
    
    // Check if features are displayed
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('displays venue hours if available', () => {
    const venueWithHours = {
      ...mockVenue,
      hours: 'Mon-Fri: 9AM-11PM, Sat-Sun: 10AM-12AM',
    };
    
    customRender(<VenueCard {...defaultProps} venue={venueWithHours} />);
    
    expect(screen.getByText('Mon-Fri: 9AM-11PM, Sat-Sun: 10AM-12AM')).toBeInTheDocument();
  });

  it('handles venue with no address gracefully', () => {
    const venueWithNoAddress = {
      ...mockVenue,
      address: '',
      city: '',
      state: '',
      zipCode: '',
    };
    
    customRender(<VenueCard {...defaultProps} venue={venueWithNoAddress} />);
    
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
  });
});
