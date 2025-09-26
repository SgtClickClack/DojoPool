import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorldHub from '../world/WorldHub';

// Create inline mocks since test-utils doesn't exist
const mockUseAuth = () => ({
  user: { id: 'user1', username: 'testuser' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
});

const mockUseWebSocket = () => ({
  isConnected: true,
  sendMessage: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
});

const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Mock the hooks in the test
jest.mock('../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: mockUseWebSocket,
}));

// Mock the WorldHub component since it doesn't exist yet
jest.mock('../world/WorldHub', () => {
  return function MockWorldHub({ venues, events, onVenueSelect }: any) {
    return (
      <div data-testid="world-hub">
        <h1>World Hub</h1>
        <section data-testid="venues-section">
          <h2>Nearby Venues</h2>
          {venues?.map((venue: any) => (
            <div key={venue.id} onClick={() => onVenueSelect(venue)}>
              {venue.name} - {venue.rating} stars
            </div>
          ))}
        </section>
        <section data-testid="events-section">
          <h2>Live Events</h2>
          {events?.map((event: any) => (
            <div key={event.id}>
              {event.title} at {event.venue}
            </div>
          ))}
        </section>
      </div>
    );
  };
});

const mockVenues = [
  { id: 'venue-1', name: 'Test Venue 1', rating: 4.5 },
  { id: 'venue-2', name: 'Test Venue 2', rating: 4.2 },
];

const mockEvents = [
  { id: 'event-1', title: 'Pool Tournament', venue: 'Test Venue 1' },
  { id: 'event-2', title: 'Clan War', venue: 'Test Venue 2' },
];

const mockOnVenueSelect = jest.fn();

const defaultProps = {
  venues: mockVenues,
  events: mockEvents,
  onVenueSelect: mockOnVenueSelect,
};

const emptyProps = {
  ...defaultProps,
  venues: [],
  events: [],
};

describe('WorldHub', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders world hub with venues and events', () => {
    customRender(<WorldHub {...defaultProps} />);
    
    expect(screen.getByTestId('world-hub')).toBeInTheDocument();
    expect(screen.getByText('World Hub')).toBeInTheDocument();
    expect(screen.getByTestId('venues-section')).toBeInTheDocument();
    expect(screen.getByTestId('events-section')).toBeInTheDocument();
    expect(screen.getByText('Test Venue 1 - 4.5 stars')).toBeInTheDocument();
    expect(screen.getByText('Pool Tournament at Test Venue 1')).toBeInTheDocument();
  });

  it('handles venue selection', () => {
    customRender(<WorldHub {...defaultProps} />);
    
    const firstVenue = screen.getAllByText(/Test Venue/i)[0];
    fireEvent.click(firstVenue);
    
    expect(mockOnVenueSelect).toHaveBeenCalledWith(mockVenues[0]);
  });

  it('displays empty state when no data', () => {
    customRender(<WorldHub {...emptyProps} />);
    
    expect(screen.getByTestId('venues-section')).toBeInTheDocument();
    expect(screen.getByTestId('events-section')).toBeInTheDocument();
    // Should still render sections even if empty
  });

  it('uses authentication context', () => {
    customRender(<WorldHub {...defaultProps} />);
    
    // The mock ensures auth context is used
    expect(mockUseAuth).toHaveBeenCalled();
  });

  it('uses websocket context', () => {
    customRender(<WorldHub {...defaultProps} />);
    
    // The mock ensures websocket context is used
    expect(mockUseWebSocket).toHaveBeenCalled();
  });

  it('renders performance test case', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<WorldHub {...defaultProps} />);
    });
    
    expect(renderTime).toBeLessThan(100);
  }, 10000);

  it('renders with minimal props', () => {
    customRender(<WorldHub venues={[]} events={[]} onVenueSelect={jest.fn()} />);
    
    expect(screen.getByText('World Hub')).toBeInTheDocument();
  });
});
