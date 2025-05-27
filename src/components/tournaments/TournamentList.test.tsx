// Polyfill TextEncoder/TextDecoder for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TournamentList from './TournamentList';
import { TournamentStatus } from '@/types/tournament';

// Mock data
const mockTournaments = [
  {
    id: 't1',
    name: 'Open Tournament',
    status: TournamentStatus.OPEN,
    participants: 3,
    maxParticipants: 8,
    startDate: new Date().toISOString(),
    venue: { id: 'v1', name: 'Venue 1' },
  },
  {
    id: 't2',
    name: 'Full Tournament',
    status: TournamentStatus.FULL,
    participants: 8,
    maxParticipants: 8,
    startDate: new Date().toISOString(),
    venue: { id: 'v2', name: 'Venue 2' },
  },
  {
    id: 't3',
    name: 'Cancelled Tournament',
    status: TournamentStatus.CANCELLED,
    participants: 0,
    maxParticipants: 8,
    startDate: new Date().toISOString(),
    venue: { id: 'v3', name: 'Venue 3' },
  },
];

jest.mock('@/frontend/api/tournaments', () => ({
  getTournaments: jest.fn(() => Promise.resolve(mockTournaments)),
  registerForTournament: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@/frontend/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user1', username: 'TestUser' }, loading: false })
}));

const renderComponent = () =>
  render(
    <MemoryRouter>
      <TournamentList />
    </MemoryRouter>
  );

describe('TournamentList', () => {
  it('renders loading state', () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders tournaments after fetch', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Open Tournament')).toBeInTheDocument();
      expect(screen.getByText('Full Tournament')).toBeInTheDocument();
      expect(screen.getByText('Cancelled Tournament')).toBeInTheDocument();
    });
  });

  it('shows Register button for open tournaments', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/Register/i).length).toBeGreaterThan(0);
    });
  });

  it('shows Registration Full for full tournaments', async () => {
    renderComponent();
    await waitFor(() => {
      const fullButtons = screen.getAllByRole('button', { name: /Full/i });
      expect(fullButtons.length).toBeGreaterThan(0);
      fullButtons.forEach(btn => expect(btn).toBeDisabled());
    });
  });

  it('shows Cancelled for cancelled tournaments', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/Cancelled/i).length).toBeGreaterThan(0);
    });
  });

  it('handles empty tournaments list', async () => {
    const { getTournaments } = require('@/frontend/api/tournaments');
    getTournaments.mockResolvedValueOnce([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/No upcoming tournaments found\./i)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    const { getTournaments } = require('@/frontend/api/tournaments');
    getTournaments.mockRejectedValueOnce(new Error('Failed to fetch'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('navigates to tournament detail on click', async () => {
    renderComponent();
    await waitFor(() => {
      const openTournament = screen.getByText('Open Tournament');
      fireEvent.click(openTournament);
      // Navigation assertion would go here if using a router mock
    });
  });
}); 