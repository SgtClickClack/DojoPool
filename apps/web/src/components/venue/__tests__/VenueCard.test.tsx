import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VenueCard from '../VenueCard';
import type { Venue, VenueTable } from '@/types/venue';

// Mock VenueTable data with proper structure
const mockVenueTable: VenueTable = {
  id: 'table-1',
  venueId: 'venue-1',
  tableNumber: 1,
  status: 'AVAILABLE',
  players: 0,
  maxPlayers: 8,
  currentGame: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock Venue data with proper structure
const mockVenue: Venue = {
  id: 'venue-1',
  name: 'Test Venue',
  description: 'A test venue for testing',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
  },
  status: 'ACTIVE',
  tables: [mockVenueTable],
  images: [],
  rating: 4.5,
  reviewCount: 120,
  features: ['WiFi', 'Food & Drink'],
  amenities: ['Parking', 'Restrooms'],
  isVerified: true,
  hours: [
    {
      day: 'Monday',
      open: '09:00',
      close: '00:00',
      isOpen: true,
    },
    {
      day: 'Tuesday',
      open: '09:00',
      close: '00:00',
      isOpen: true,
    },
    // Add more days as needed
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOnVisit = jest.fn();
const mockOnChallenge = jest.fn();
const mockOnViewDetails = jest.fn();

const defaultProps = {
  venue: mockVenue,
  onVisit: mockOnVisit,
  onChallenge: mockOnChallenge,
  onViewDetails: mockOnViewDetails,
};

const venueWithNoTables = {
  ...mockVenue,
  tables: [],
};

const venueWithRating = {
  ...mockVenue,
  rating: 3.8,
};

const venueWithLongName = {
  ...mockVenue,
  name: 'This is a very long venue name that should wrap properly in the UI',
};

const venueWithStatus = {
  ...mockVenue,
  status: 'ACTIVE',
};

const venueWithFeatures = {
  ...mockVenue,
  features: ['WiFi', 'VIP Area', 'Private Rooms'],
};

const venueWithHours = {
  ...mockVenue,
  hours: [
    {
      day: 'Monday',
      open: '10:00',
      close: '02:00',
      isOpen: true,
    },
    {
      day: 'Tuesday',
      open: '10:00',
      close: '02:00',
      isOpen: true,
    },
    // Add more days
  ],
};

const venueWithNoAddress = {
  ...mockVenue,
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
  },
};

const propsWithNoTables = {
  ...defaultProps,
  venue: venueWithNoTables,
};

const propsWithRating = {
  ...defaultProps,
  venue: venueWithRating,
};

const propsWithLongName = {
  ...defaultProps,
  venue: venueWithLongName,
};

const propsWithStatus = {
  ...defaultProps,
  venue: venueWithStatus,
};

const propsWithFeatures = {
  ...defaultProps,
  venue: venueWithFeatures,
};

const propsWithHours = {
  ...defaultProps,
  venue: venueWithHours,
};

const propsWithNoAddress = {
  ...defaultProps,
  venue: venueWithNoAddress,
};

const disabledProps = {
  ...defaultProps,
  disabled: true,
};

const minimalProps = {
  venue: {
    id: 'min-venue',
    name: 'Minimal Venue',
    description: 'Minimal venue description',
    status: 'ACTIVE',
    address: {
      street: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
    },
    tables: [],
    images: [],
    rating: 0,
    reviewCount: 0,
    features: [],
    amenities: [],
    isVerified: false,
    hours: [
      {
        day: 'Monday',
        open: '09:00',
        close: '17:00',
        isOpen: true,
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  onVisit: jest.fn(),
  onChallenge: jest.fn(),
  onViewDetails: jest.fn(),
};

describe('VenueCard', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders venue information correctly', () => {
    customRender(<VenueCard {...defaultProps} />);

    expect(screen.getByText(mockVenue.name)).toBeInTheDocument();
    expect(screen.getByText(mockVenue.description!)).toBeInTheDocument();
    expect(screen.getByText(mockVenue.address.city)).toBeInTheDocument();
    expect(screen.getByText(mockVenue.rating.toString())).toBeInTheDocument();
  });

  it('displays rating stars', () => {
    customRender(<VenueCard {...defaultProps} />);

    // Check for star rating display
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('shows venue status', () => {
    customRender(<VenueCard {...defaultProps} />);

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('handles visit button click', () => {
    customRender(<VenueCard {...defaultProps} />);

    const visitButton = screen.getByRole('button', { name: /visit/i });
    fireEvent.click(visitButton);

    expect(mockOnVisit).toHaveBeenCalledWith(mockVenue.id);
  });

  it('handles challenge button click', () => {
    customRender(<VenueCard {...defaultProps} />);

    const challengeButton = screen.getByRole('button', { name: /challenge/i });
    fireEvent.click(challengeButton);

    expect(mockOnChallenge).toHaveBeenCalledWith(mockVenue.id);
  });

  it('handles view details click', () => {
    customRender(<VenueCard {...defaultProps} />);

    const viewDetailsButton = screen.getByRole('button', { name: /details/i });
    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockVenue.id);
  });

  it('displays no tables message when empty', () => {
    customRender(<VenueCard {...propsWithNoTables} />);

    expect(screen.getByText('No tables available')).toBeInTheDocument();
  });

  it('displays rating when available', () => {
    customRender(<VenueCard {...propsWithRating} />);

    expect(screen.getByText('3.8')).toBeInTheDocument();
  });

  it('handles long venue name', () => {
    customRender(<VenueCard {...propsWithLongName} />);

    expect(screen.getByText(venueWithLongName.name)).toBeInTheDocument();
  });

  it('displays venue status correctly', () => {
    customRender(<VenueCard {...propsWithStatus} />);

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays features when available', () => {
    customRender(<VenueCard {...propsWithFeatures} />);

    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('VIP Area')).toBeInTheDocument();
    expect(screen.getByText('Private Rooms')).toBeInTheDocument();
  });

  it('displays hours when available', () => {
    customRender(<VenueCard {...propsWithHours} />);

    expect(screen.getByText('Mon-Fri: 10AM-2AM')).toBeInTheDocument();
  });

  it('handles venue with proper address structure', () => {
    customRender(<VenueCard {...propsWithNoAddress} />);

    expect(screen.getByText('Test City')).toBeInTheDocument();
  });

  it('renders disabled state correctly', () => {
    customRender(<VenueCard {...disabledProps} />);

    const visitButton = screen.getByRole('button', { name: /visit/i });
    expect(visitButton).toBeDisabled();
  });

  it('handles minimal props without errors', () => {
    expect(() => customRender(<VenueCard {...minimalProps} />)).not.toThrow();
  });

  it('renders performance test case', async () => {
    customRender(<VenueCard {...defaultProps} />);

    expect(screen.getByText(mockVenue.name)).toBeInTheDocument();
  }, 5000);
});
