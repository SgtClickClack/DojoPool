import React from 'react';

// Mock useAuth hook
export const mockUseAuth = () => ({
  user: { id: 'user1', username: 'testuser', email: 'test@example.com' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
});

// Mock useWebSocket hook
export const mockUseWebSocket = () => ({
  isConnected: true,
  sendMessage: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  connectionStatus: 'connected',
});

// Custom render function with providers
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Measure render time utility
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Mock user data
export const mockUser = {
  id: 'user1',
  username: 'testuser',
  email: 'test@example.com',
  profile: {
    displayName: 'Test User',
    avatarUrl: '/avatar.jpg',
  },
};

// Mock venue data
export const mockVenue = {
  id: 'venue-1',
  name: 'Test Venue',
  address: {
    city: 'Test City',
    state: 'Test State',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
  },
  rating: 4.5,
  status: 'ACTIVE',
};

// Mock event data
export const mockEvent = {
  id: 'event-1',
  title: 'Test Event',
  venue: 'Test Venue',
  startTime: '2024-01-01T10:00:00Z',
  type: 'tournament',
};

export * from '@testing-library/react';
