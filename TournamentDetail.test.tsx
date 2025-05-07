import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TournamentDetail from './TournamentDetail';
import { AuthProvider, useAuth } from '@/frontend/contexts/AuthContext'; // Import AuthProvider for wrapping
import * as tournamentApi from '@/frontend/api/tournaments';
import * as venueApi from '@/dojopool/frontend/api/venues';
import { TournamentStatus, TournamentFormat } from '@/types/tournament';

// Mock the API modules
jest.mock('@/frontend/api/tournaments');
jest.mock('@/dojopool/frontend/api/venues');
// Mock the AuthContext
jest.mock('@/frontend/contexts/AuthContext'); 

// Type assertion for mocked functions
const mockedGetTournament = tournamentApi.getTournament as jest.Mock;
const mockedGetVenue = venueApi.getVenue as jest.Mock;
const mockedJoinTournament = tournamentApi.joinTournament as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock; // Now mocking useAuth

// Helper function for rendering with router and auth context
const renderComponent = (mockUser: any = null, tournamentId: string = 't1') => {
  // Mock useAuth return value for this render
  mockedUseAuth.mockReturnValue({ user: mockUser, loading: false });

  return render(
    <MemoryRouter initialEntries={[`/tournaments/${tournamentId}`]}>
      {/* No need for AuthProvider wrapper if useAuth is directly mocked */}
      <Routes>
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('TournamentDetail Component', () => {
  // Mock data
  const mockTournamentData = {
    id: 't1',
    name: 'Test Tournament',
    format: TournamentFormat.SINGLE_ELIMINATION,
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

  beforeEach(() => {
    // Reset mocks before each test
    mockedGetTournament.mockClear();
    mockedGetVenue.mockClear();
    mockedJoinTournament.mockClear();
    mockedUseAuth.mockClear(); // Clear useAuth mock
  });

  test('renders loading state initially', () => {
    mockedGetTournament.mockResolvedValue(new Promise(() => {})); // Keep promise pending
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders tournament details after successful fetch', async () => {
    mockedGetTournament.mockResolvedValue(mockTournamentData);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Status:/)).toHaveTextContent(TournamentStatus.OPEN);
    expect(screen.getByText(/Format:/)).toHaveTextContent(TournamentFormat.SINGLE_ELIMINATION);
    expect(screen.getByText(/Players:/)).toHaveTextContent('5 / 16');
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test rules')).toBeInTheDocument();
  });

  test('renders venue details after successful fetch', async () => {
     mockedGetTournament.mockResolvedValue(mockTournamentData);
     mockedGetVenue.mockResolvedValue(mockVenueData);
     renderComponent();

     await waitFor(() => {
        // Wait for venue name specifically
        expect(screen.getByText(/Venue:/)).toHaveTextContent('Test Venue');
     });
  });

   test('renders participants list', async () => {
    mockedGetTournament.mockResolvedValue(mockTournamentData);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent();

    await waitFor(() => {
        expect(screen.getByText('Participants (2)')).toBeInTheDocument();
    });
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
  });

  test('handles tournament fetch error', async () => {
    const errorMsg = 'Failed to load tournament';
    mockedGetTournament.mockRejectedValue(new Error(errorMsg));
    renderComponent();

    await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(errorMsg);
    });
  });

  test('handles venue fetch error', async () => {
     mockedGetTournament.mockResolvedValue(mockTournamentData);
     mockedGetVenue.mockRejectedValue(new Error('Failed to load venue')); // Make venue fetch fail
     renderComponent();

     await waitFor(() => {
        // Check for venue specific error text within the venue line
        expect(screen.getByText(/Venue:/)).toHaveTextContent('(Failed to load venue details.)');
     });
  });

  // --- Button Tests --- 

  test('shows Register button for OPEN tournament when logged in', async () => {
    const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    mockedGetTournament.mockResolvedValue(mockOpenTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' }); // Pass a mock user object

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Register Now/i })).toBeInTheDocument();
    });
  });

  test('does NOT show Register button for OPEN tournament when logged out', async () => {
    const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    mockedGetTournament.mockResolvedValue(mockOpenTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent(null); // Render with no user

    await waitFor(() => {
      // Wait for basic content to ensure loading is done
      expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    });
    
    expect(screen.queryByRole('button', { name: /Register Now/i })).not.toBeInTheDocument();
  });

  test('shows Register button for UPCOMING tournament when logged in', async () => {
    const mockUpcomingTournament = { ...mockTournamentData, status: TournamentStatus.UPCOMING };
    mockedGetTournament.mockResolvedValue(mockUpcomingTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' }); // Pass a mock user object

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Register Now/i })).toBeInTheDocument();
    });
  });

  test('shows Registration Full button when tournament is FULL', async () => {
    const mockFullTournament = { ...mockTournamentData, status: TournamentStatus.FULL };
    mockedGetTournament.mockResolvedValue(mockFullTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' }); // Auth state doesn't matter here

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Registration Full/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });
  
  test('shows Registration Closed button when tournament is CLOSED', async () => {
    const mockClosedTournament = { ...mockTournamentData, status: TournamentStatus.CLOSED };
    mockedGetTournament.mockResolvedValue(mockClosedTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' });

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Registration Closed/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

   test('shows Tournament In Progress button when tournament is ACTIVE', async () => {
    const mockActiveTournament = { ...mockTournamentData, status: TournamentStatus.ACTIVE };
    mockedGetTournament.mockResolvedValue(mockActiveTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' });

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Tournament In Progress/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  test('shows Tournament Completed button when tournament is COMPLETED', async () => {
    const mockCompletedTournament = { ...mockTournamentData, status: TournamentStatus.COMPLETED };
    mockedGetTournament.mockResolvedValue(mockCompletedTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' });

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Tournament Completed/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  test('shows Tournament Cancelled button when tournament is CANCELLED', async () => {
    const mockCancelledTournament = { ...mockTournamentData, status: TournamentStatus.CANCELLED };
    mockedGetTournament.mockResolvedValue(mockCancelledTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    renderComponent({ uid: 'test-user' });

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Tournament Cancelled/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  test('calls joinTournament on Register Now button click when logged in', async () => {
    const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    mockedGetTournament.mockResolvedValue(mockOpenTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    mockedJoinTournament.mockResolvedValue({}); // Mock successful registration
    const mockUser = { uid: 'test-user-reg' }; 
    renderComponent(mockUser);

    // Find and click the button
    const registerButton = await screen.findByRole('button', { name: /Register Now/i });
    fireEvent.click(registerButton);

    // Check if joinTournament was called correctly
    await waitFor(() => {
        expect(mockedJoinTournament).toHaveBeenCalledTimes(1);
        expect(mockedJoinTournament).toHaveBeenCalledWith(mockOpenTournament.id);
    });

    // Optional: Check for loading indicator during call
    // (Requires more setup if the call is very fast)

    // Optional: Check for success feedback (e.g., alert was called - requires mocking window.alert)
    // window.alert = jest.fn();
    // await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Successfully registered!'));
  });

  test('handles error during registration click', async () => {
    const errorMsg = "Registration failed";
    const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    mockedGetTournament.mockResolvedValue(mockOpenTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    mockedJoinTournament.mockRejectedValue(new Error(errorMsg)); // Mock failed registration
    const mockUser = { uid: 'test-user-err' }; 
    renderComponent(mockUser);

    // Find and click the button
    const registerButton = await screen.findByRole('button', { name: /Register Now/i });
    fireEvent.click(registerButton);

    // Check if joinTournament was called
    await waitFor(() => {
        expect(mockedJoinTournament).toHaveBeenCalledTimes(1);
    });

    // Check for error alert (requires mocking window.alert)
    window.alert = jest.fn();
    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(`Registration failed: ${errorMsg}`);
    });

    // Check if error state is reflected in component (optional)
    // expect(screen.getByRole('alert')).toHaveTextContent(errorMsg); // Check if the Alert component shows up
  });

  test('disables Register Now button during registration', async () => {
    let resolveJoin: (value: unknown) => void;
    const joinPromise = new Promise((resolve) => { resolveJoin = resolve; });

    const mockOpenTournament = { ...mockTournamentData, status: TournamentStatus.OPEN };
    mockedGetTournament.mockResolvedValue(mockOpenTournament);
    mockedGetVenue.mockResolvedValue(mockVenueData);
    mockedJoinTournament.mockReturnValue(joinPromise); // Return unresolved promise
    const mockUser = { uid: 'test-user-dis' }; 
    renderComponent(mockUser);

    // Find and click the button
    const registerButton = await screen.findByRole('button', { name: /Register Now/i });
    fireEvent.click(registerButton);

    // Check immediately after click that the button shows loading/is disabled
    // The button text changes to a progress indicator, so we check for that role
    await waitFor(() => {
        expect(registerButton).toBeDisabled(); // Or check for progress bar role
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the promise and wait for button to re-enable
    resolveJoin!({});
    await waitFor(() => {
        expect(registerButton).not.toBeDisabled();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  // TODO: Add tests for unregister and view bracket clicks if those buttons are implemented

}); 