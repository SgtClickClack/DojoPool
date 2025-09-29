import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/components/__tests__/test-utils';
import TournamentList from '../TournamentList';
import type { Tournament } from '@/types/tournament';
import { TournamentStatus } from '@/types/tournament';

const baseTournament: Tournament = {
  id: 'tournament-1',
  name: 'Test Tournament 1',
  description: 'Test tournament description',
  venueId: 'venue-1',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-01T12:00:00Z',
  status: TournamentStatus.REGISTRATION,
  maxPlayers: 16,
  entryFee: 100,
  prizePool: 1000,
  participants: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const onJoin = vi.fn();
const onView = vi.fn();
const onFilter = vi.fn();

const renderList = (overrides: Partial<React.ComponentProps<typeof TournamentList>> = {}) =>
  render(
    <TournamentList
      tournaments={[baseTournament]}
      onJoin={onJoin}
      onView={onView}
      onFilter={onFilter}
      {...overrides}
    />
  );

describe('TournamentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tournaments with summary information', () => {
    renderList();

    expect(screen.getByText('Test Tournament 1')).toBeInTheDocument();
    expect(screen.getByText('Test tournament description')).toBeInTheDocument();
    expect(screen.getByText(/Status:\s+REGISTRATION/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderList({ loading: true });

    expect(screen.getByText('Loading tournaments...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    renderList({ error: 'Failed to load tournaments' });

    expect(screen.getByText('Failed to load tournaments')).toBeInTheDocument();
  });

  it('shows empty state when no tournaments', () => {
    renderList({ tournaments: [] });

    expect(screen.getByText('No tournaments available')).toBeInTheDocument();
  });

  it('calls join handler when join button is clicked', () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: /join/i }));
    expect(onJoin).toHaveBeenCalledWith('tournament-1');
  });

  it('calls view handler when view button is clicked', () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(onView).toHaveBeenCalledWith('tournament-1');
  });

  it('handles disabled action buttons', () => {
    renderList({ disabled: true });

    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled();
  });
});
