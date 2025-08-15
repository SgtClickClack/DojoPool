import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

// Mock auth context value
const mockAuthContext = {
  currentUser: null,
  loading: false,
  error: null,
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  updateEmail: jest.fn(),
};

// Custom render function that includes all providers
function renderWithProviders(
  ui: React.ReactElement,
  {
    route = '/',
    authValue = mockAuthContext,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <ChakraProvider>
          <AuthProvider value={authValue}>
            {children}
          </AuthProvider>
        </ChakraProvider>
      </BrowserRouter>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { renderWithProviders as render };

// Export mock auth context for tests that need to customize it
export const mockAuth = mockAuthContext;

// Helper to create a mock user
export const createMockUser = (overrides = {}) => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  ...overrides,
});

// Helper to create a mock tournament
export const createMockTournament = (overrides = {}) => ({
  id: 'test-tournament-id',
  name: 'Test Tournament',
  format: '8-ball',
  participants: [],
  maxParticipants: 16,
  status: 'upcoming',
  startDate: new Date().toISOString(),
  venueId: 'test-venue-id',
  ...overrides,
});

// Helper to create a mock venue
export const createMockVenue = (overrides = {}) => ({
  id: 'test-venue-id',
  name: 'Test Venue',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  ...overrides,
});

// Helper to create a mock game
export const createMockGame = (overrides = {}) => ({
  id: 'test-game-id',
  tournamentId: 'test-tournament-id',
  player1Id: 'player1-id',
  player2Id: 'player2-id',
  status: 'pending',
  score: { player1: 0, player2: 0 },
  ...overrides,
}); 