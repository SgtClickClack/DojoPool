import '@testing-library/jest-dom';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import React, { ReactElement } from 'react';

// Create a test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={testTheme}>
      {children}
    </ThemeProvider>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data factories
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  profile: {
    displayName: 'Test User',
    skillRating: 1500,
    avatar: 'https://example.com/avatar.jpg',
  },
};

export const mockTournament = {
  id: '1',
  name: 'Test Tournament',
  description: 'A test tournament',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(),
  location: 'Test Venue',
  maxParticipants: 16,
  currentParticipants: 0,
  entryFee: 100,
  prizePool: 1000,
  status: 'REGISTRATION' as const,
};

export const mockVenue = {
  id: '1',
  name: 'Test Venue',
  description: 'A test venue',
  status: 'ACTIVE' as const,
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
  },
  images: [],
  rating: 4.5,
  reviewCount: 10,
  tables: 4,
  features: ['pool', 'bar'],
  amenities: ['parking', 'food'],
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockClan = {
  id: '1',
  name: 'Test Clan',
  description: 'A test clan',
  leaderId: '1',
  treasury: 1000,
  memberCount: 5,
  territories: [],
};

export const mockMatch = {
  id: '1',
  player1Id: '1',
  player2Id: '2',
  status: 'ACTIVE' as const,
  score1: 0,
  score2: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock API responses
export const mockAPIResponses = {
  getUser: () => Promise.resolve(mockUser),
  getTournaments: () => Promise.resolve([mockTournament]),
  getVenues: () => Promise.resolve([mockVenue]),
  getClans: () => Promise.resolve([mockClan]),
  getMatches: () => Promise.resolve([mockMatch]),
};

// Mock hooks
export const mockUseAuth = () => ({
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  setToken: vi.fn(),
});

export const mockUseWebSocket = () => ({
  isConnected: true,
  connectionStatus: 'connected',
  sendMessage: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
});

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const createMockProps = <T extends Record<string, any>>(
  overrides: Partial<T> = {}
): T => {
  return {
    ...overrides,
  } as T;
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
