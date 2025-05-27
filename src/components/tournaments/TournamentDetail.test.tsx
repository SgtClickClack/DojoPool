import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TournamentDetail from './TournamentDetail';
// import { AuthProvider, useAuth } from '../../frontend/contexts/AuthContext';
// import * as tournamentApi from '../../frontend/api/tournaments';
// import * as venueApi from '../../dojopool/frontend/api/venues';
import { within } from '@testing-library/react';
import { TournamentFormat, TournamentStatus } from '@/types/tournament';

// Mock data
const mockTournamentData = {
  id: 't1',
  name: 'Test Tournament',
  format: TournamentFormat.SINGLE_ELIMINATION,
  type: 'SINGLE_ELIMINATION',
  startDate: new Date(),
  venueId: 'v1',
  organizerId: 'org1',
  participants: 5,
  maxParticipants: 16,
  status: TournamentStatus.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
  participantsList: [
      { id: 'p1', username: 'Player One', status: 'registered' },
      { id: 'p2', username: 'Player Two', status: 'registered' },
  ],
  description: 'Test description',
  rules: 'Test rules'
};

const mockVenueData = {
  id: 'v1',
  name: 'Test Venue',
  // Add other required Venue fields if needed for rendering
};

// Mock the API modules
jest.mock('@/frontend/api/tournaments', () => ({
  getTournament: jest.fn(() => Promise.resolve(mockTournamentData)),
  joinTournament: jest.fn(() => Promise.resolve({})),
}));
jest.mock('@/dojopool/frontend/api/venues', () => ({
  getVenue: jest.fn(() => Promise.resolve(mockVenueData)),
}));
// Mock the AuthContext
let mockUser: any = { id: 'test-user', username: 'Test User', role: 'user' };
jest.mock('@/frontend/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, loading: false })
}));

// Mock the specific firebase config file causing import.meta issues
jest.mock('../../dojopool/frontend/config/[FB]firebase', () => ({
  auth: jest.fn(() => ({ /* mock auth object if needed */ })) // Provide mock auth
}));

// Mock the module using import.meta
jest.mock('@/frontend/api/axiosInstance', () => ({
  __esModule: true, // Use this for ES modules
  default: {
    // Mock whatever axiosInstance exports and is used by tournamentApi/venueApi
    get: jest.fn(),
    post: jest.fn(),
    // Add other methods if needed
  },
}));

// Type assertion for mocked functions
// const mockedGetTournament = tournamentApi.getTournament as jest.Mock;
// const mockedGetVenue = venueApi.getVenue as jest.Mock;
// const mockedJoinTournament = tournamentApi.joinTournament as jest.Mock;
// const mockedUseAuth = useAuth as jest.Mock; // Now mocking useAuth

// Helper function for rendering with router and auth context
const renderComponent = (mockUser: any = null, tournamentId: string = 't1') => {
  mockUser = mockUser || mockUser;
  return render(
    <MemoryRouter initialEntries={[`/tournaments/${tournamentId}`]}>
      <Routes>
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('TournamentDetail Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    // mockedGetTournament.mockClear();
    // mockedGetVenue.mockClear();
    // mockedJoinTournament.mockClear();
    // mockedUseAuth.mockClear(); // Clear useAuth mock
  });

  test('renders loading state initially', () => {
    // mockedGetTournament.mockResolvedValue(new Promise(() => {})); // Keep promise pending
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders tournament details after successful fetch', async () => {
    // mockedGetTournament.mockResolvedValue(mockTournamentData);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    });
    // Use function matcher for split nodes
    expect(screen.getByText((content, node) => node?.textContent === `Status: ${TournamentStatus.OPEN}`)).toBeInTheDocument();
    expect(screen.getByText((content, node) => node?.textContent === `Format: ${TournamentFormat.SINGLE_ELIMINATION}`)).toBeInTheDocument();
    expect(screen.getByText((content, node) => node?.textContent === 'Players: 5 / 16')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test rules')).toBeInTheDocument();
  });

  test('renders venue details after successful fetch', async () => {
     // mockedGetTournament.mockResolvedValue(mockTournamentData);
     // mockedGetVenue.mockResolvedValue(mockVenueData);
     renderComponent();

     await waitFor(() => {
        // Find the <strong>Venue:</strong> element, then check its parent textContent
        const venueStrong = screen.getByText('Venue:', { selector: 'strong' });
        expect(venueStrong.parentElement?.textContent).toBe('Venue: Test Venue');
     });
  });

   test('renders participants list', async () => {
    // mockedGetTournament.mockResolvedValue(mockTournamentData);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Participants (2)')).toBeInTheDocument();
    });
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
  });

  test('handles tournament fetch error', async () => {
    const errorMsg = 'Failed to load tournament';
    // mockedGetTournament.mockRejectedValue(new Error(errorMsg));
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  test('handles venue fetch error', async () => {
     // mockedGetTournament.mockResolvedValue(mockTournamentData);
     // mockedGetVenue.mockRejectedValue(new Error('Failed to load venue'));
     renderComponent();

     await waitFor(() => {
        const venueStrong = screen.getByText('Venue:', { selector: 'strong' });
        expect(venueStrong.parentElement?.textContent).toBe('Venue: (Failed to load venue details.)');
     });
  });

  // --- Button Tests --- 

  test('shows Register button for OPEN tournament when logged in', async () => {
    // const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    // mockedGetTournament.mockResolvedValue(mockOpenTournament);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' }); // Pass a mock user object

    await waitFor(() => {
      expect(screen.getByText(/Register Now/i)).toBeInTheDocument();
    });
  });

  test('does NOT show Register button for OPEN tournament when logged out', async () => {
    // const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    // mockedGetTournament.mockResolvedValue(mockOpenTournament);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent(null); // Render with no user

    await waitFor(() => {
      // Wait for basic content to ensure loading is done
      expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    });
    
    expect(screen.queryByText(/Register Now/i)).not.toBeInTheDocument();
  });

  test('shows Register button for UPCOMING tournament when logged in', async () => {
    const mockUpcomingTournament = { ...mockTournamentData, status: TournamentStatus.UPCOMING, type: 'SINGLE_ELIMINATION' };
    renderComponent({ uid: 'test-user' });
    await waitFor(() => {
      expect(screen.getByText(/Register Now/i)).toBeInTheDocument();
    });
  });

  test('shows Registration Full button when tournament is FULL', async () => {
    const mockFullTournament = { ...mockTournamentData, status: TournamentStatus.FULL, type: 'SINGLE_ELIMINATION' };
    renderComponent({ uid: 'test-user' });
    await waitFor(() => {
      const button = screen.getByText(/Registration Full/i);
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });
  
  test('shows Registration Closed button when tournament is CLOSED', async () => {
    const mockClosedTournament = { ...mockTournamentData, status: TournamentStatus.CLOSED, type: 'SINGLE_ELIMINATION' };
    renderComponent({ uid: 'test-user' });
    await waitFor(() => {
      const button = screen.getByText(/Registration Closed/i);
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

   test('shows Tournament In Progress button when tournament is ACTIVE', async () => {
    const mockActiveTournament = { ...mockTournamentData, status: TournamentStatus.ACTIVE, type: 'SINGLE_ELIMINATION' };
    renderComponent({ uid: 'test-user' });
    await waitFor(() => {
      const button = screen.getByText(/Tournament In Progress/i);
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  test('shows Tournament Completed button when tournament is COMPLETED', async () => {
    const mockCompletedTournament = { ...mockTournamentData, status: TournamentStatus.COMPLETED, type: 'SINGLE_ELIMINATION' };
    renderComponent({ uid: 'test-user' });
    await waitFor(() => {
      const button = screen.getByText(/Tournament Completed/i);
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  test('shows Tournament Cancelled button when tournament is CANCELLED', async () => {
    const mockCancelledTournament = { ...mockTournamentData, status: TournamentStatus.CANCELLED, type: 'SINGLE_ELIMINATION' };
    renderComponent({ uid: 'test-user' });
    await waitFor(() => {
      const button = screen.getByText(/Tournament Cancelled/i);
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  test('calls joinTournament on Register Now button click when logged in', async () => {
    // const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    // mockedGetTournament.mockResolvedValue(mockOpenTournament);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    // mockedJoinTournament.mockResolvedValue({}); // Mock successful registration
    const mockUser = { uid: 'test-user-reg' }; 
    renderComponent(mockUser);

    // Find and click the button
    const registerButton = await screen.findByText(/Register Now/i);
    fireEvent.click(registerButton);

    // Check if joinTournament was called correctly
    await waitFor(() => {
        // expect(mockedJoinTournament).toHaveBeenCalledTimes(1);
        // expect(mockedJoinTournament).toHaveBeenCalledWith(mockOpenTournament.id);
    });

    // Optional: Check for loading indicator during call
    // (Requires more setup if the call is very fast)

    // Optional: Check for success feedback (e.g., alert was called - requires mocking window.alert)
    // window.alert = jest.fn();
    // await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Successfully registered!'));
  });

  test('handles error during registration click', async () => {
    // mockedGetTournament.mockResolvedValue(mockTournamentData);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    // mockedJoinTournament.mockRejectedValue(new Error('Registration failed'));
    renderComponent({ uid: 'test-user' });

    await waitFor(() => {
      expect(screen.getByText(/Register Now/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Register Now/i));
    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });

  test('disables Register Now button during registration', async () => {
    let resolveJoin: (value: unknown) => void;
    const joinPromise = new Promise((resolve) => { resolveJoin = resolve; });
    const mockUser = { uid: 'test-user-dis' };
    renderComponent(mockUser);

    // Step 1: Click 'Register Now'
    const registerNowButton = await screen.findByText(/Register Now/i);
    fireEvent.click(registerNowButton);

    // Step 2: Click 'Next'
    const nextButton = await screen.findByText('Next');
    fireEvent.click(nextButton);

    // Step 3: Click 'Accept & Continue'
    const acceptButton = await screen.findByText('Accept & Continue');
    fireEvent.click(acceptButton);

    // Step 4: Click 'Pay & Register'
    const payRegisterButton = await screen.findByText('Pay & Register');
    fireEvent.click(payRegisterButton);

    // Check immediately after click that the button is disabled and shows loading
    await waitFor(() => {
      expect(payRegisterButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the promise and wait for button to re-enable
    resolveJoin!({});
    await waitFor(() => {
      expect(payRegisterButton).not.toBeDisabled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  // Replace alert checks with Snackbar checks
  test('shows Snackbar on successful registration', async () => {
    const mockUser = { uid: 'test-user-reg' };
    renderComponent(mockUser);

    // Step 1: Click 'Register Now'
    const registerNowButton = await screen.findByText(/Register Now/i);
    fireEvent.click(registerNowButton);

    // Step 2: Click 'Next'
    const nextButton = await screen.findByText('Next');
    fireEvent.click(nextButton);

    // Step 3: Click 'Accept & Continue'
    const acceptButton = await screen.findByText('Accept & Continue');
    fireEvent.click(acceptButton);

    // Step 4: Click 'Pay & Register'
    const payRegisterButton = await screen.findByText('Pay & Register');
    fireEvent.click(payRegisterButton);

    // Check for Snackbar feedback
    await waitFor(() => {
      expect(screen.getByText('Registration successful!')).toBeInTheDocument();
    });
  });

  test('shows Snackbar on registration error', async () => {
    const mockUser = { uid: 'test-user' };
    renderComponent(mockUser);

    // Step 1: Click 'Register Now'
    const registerNowButton = await screen.findByText(/Register Now/i);
    fireEvent.click(registerNowButton);

    // Step 2: Click 'Next'
    const nextButton = await screen.findByText('Next');
    fireEvent.click(nextButton);

    // Step 3: Click 'Accept & Continue'
    const acceptButton = await screen.findByText('Accept & Continue');
    fireEvent.click(acceptButton);

    // Step 4: Click 'Pay & Register'
    const payRegisterButton = await screen.findByText('Pay & Register');
    fireEvent.click(payRegisterButton);

    await waitFor(() => {
      expect(screen.getByText((_, node) => !!node?.textContent?.includes('Registration failed'))).toBeInTheDocument();
    });
  });

  // Bracket rendering tests
  test('renders bracket section with matches', async () => {
    const mockTournamentWithMatches = {
      ...mockTournamentData,
      matches: [
        {
          id: 'm1',
          round: 1,
          participant1: { id: 'p1', username: 'Player One', status: 'registered' },
          participant2: { id: 'p2', username: 'Player Two', status: 'registered' },
          status: 'pending',
        },
      ],
    };
    // mockedGetTournament.mockResolvedValue(mockTournamentWithMatches);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Bracket')).toBeInTheDocument();
      expect(screen.getByText((_, node) => !!node?.textContent?.includes('Player One vs Player Two'))).toBeInTheDocument();
    });
  });

  test('renders bracket section with only participants', async () => {
    const mockTournamentNoMatches = { ...mockTournamentData, matches: undefined };
    // mockedGetTournament.mockResolvedValue(mockTournamentNoMatches);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Single Elimination Bracket')).toBeInTheDocument();
    });
  });

  // Result reporting modal (admin flow)
  test('admin can open and submit result reporting modal', async () => {
    const adminUser = { id: 'org1', role: 'admin' };
    const mockTournamentWithMatch = {
      ...mockTournamentData,
      matches: [
        {
          id: 'm1',
          round: 1,
          participant1: { id: 'p1', username: 'Player One', status: 'registered' },
          participant2: { id: 'p2', username: 'Player Two', status: 'registered' },
          status: 'pending',
        },
      ],
    };
    // mockedGetTournament.mockResolvedValue(mockTournamentWithMatch);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent(adminUser);
    await waitFor(() => {
      expect(screen.getByText((_, node) => !!node?.textContent?.includes('Report Result'))).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText((_, node) => !!node?.textContent?.includes('Report Result')));
    await waitFor(() => {
      expect(screen.getByText('Report Match Result')).toBeInTheDocument();
    });
    // Select winner and submit
    fireEvent.mouseDown(screen.getByLabelText('Select Winner'));
    fireEvent.click(screen.getByText('Player One'));
    fireEvent.change(screen.getByLabelText('Score (optional)'), { target: { value: '5-3' } });
    // Mock submitMatchResult
    const submitMatchResult = require('@/services/tournament/tournament').submitMatchResult;
    submitMatchResult.mockResolvedValue({});
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(screen.getByText('Result reported successfully!')).toBeInTheDocument();
    });
  });

  // Real-time update logic (simulate Socket.IO event)
  // (This would require mocking the SocketIOService and triggering the event)
  // ...

  // Edge case: reporting result with missing winner
  test('shows error Snackbar if reporting result with no winner', async () => {
    const adminUser = { id: 'org1', role: 'admin' };
    const mockTournamentWithMatch = {
      ...mockTournamentData,
      matches: [
        {
          id: 'm1',
          round: 1,
          participant1: { id: 'p1', username: 'Player One', status: 'registered' },
          participant2: { id: 'p2', username: 'Player Two', status: 'registered' },
          status: 'pending',
        },
      ],
    };
    // mockedGetTournament.mockResolvedValue(mockTournamentWithMatch);
    // mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent(adminUser);
    await waitFor(() => {
      expect(screen.getByText((_, node) => !!node?.textContent?.includes('Report Result'))).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText((_, node) => !!node?.textContent?.includes('Report Result')));
    await waitFor(() => {
      expect(screen.getByText('Report Match Result')).toBeInTheDocument();
    });
    // Do not select winner, just click submit
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(screen.getByText('Failed to report result.')).toBeInTheDocument();
    });
  });

  // TODO: Add tests for unregister and view bracket clicks if those buttons are implemented

}); 