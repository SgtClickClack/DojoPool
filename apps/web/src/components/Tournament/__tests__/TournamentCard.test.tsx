import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TournamentCard from '../TournamentCard';
import { TournamentStatus } from '@/types/tournament';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const baseTournament = {
  id: 'tournament-1',
  name: 'Cyber Clash',
  description: 'Night-long tournament under neon lights.',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-02T02:00:00Z',
  location: 'Shinjuku Dojo',
  maxParticipants: 16,
  currentParticipants: 8,
  entryFee: 100,
  prizePool: 1000,
  status: TournamentStatus.REGISTRATION,
  participants: [],
  createdAt: '2023-12-01T00:00:00Z',
  updatedAt: '2023-12-01T00:00:00Z',
};

describe('TournamentCard', () => {
  const onJoin = vi.fn();
  const onView = vi.fn();

  const defaultProps = {
    tournament: baseTournament,
    onJoin,
    onView,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders key tournament details', () => {
    renderWithTheme(<TournamentCard {...defaultProps} />);

    expect(screen.getByText('Cyber Clash')).toBeInTheDocument();
    expect(
      screen.getByText('Night-long tournament under neon lights.')
    ).toBeInTheDocument();
    expect(screen.getByText('Shinjuku Dojo')).toBeInTheDocument();
    expect(screen.getByText(/8\/16 participants/i)).toBeInTheDocument();
    expect(screen.getByText(/Entry: 100 Dojo Coins/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Prize Pool: 1000 Dojo Coins/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Registration Open')).toBeInTheDocument();
  });

  it('invokes callbacks for user actions', () => {
    renderWithTheme(<TournamentCard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(onView).toHaveBeenCalledWith('tournament-1');

    fireEvent.click(screen.getByRole('button', { name: /join tournament/i }));
    expect(onJoin).toHaveBeenCalledWith('tournament-1');
  });

  it('disables join when the tournament is full', () => {
    renderWithTheme(
      <TournamentCard
        {...defaultProps}
        tournament={{
          ...baseTournament,
          currentParticipants: 16,
        }}
      />
    );

    expect(screen.getByText('Tournament Full')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /join tournament/i })
    ).not.toBeInTheDocument();
  });

  it('hides the join button when registration is closed', () => {
    renderWithTheme(
      <TournamentCard
        {...defaultProps}
        tournament={{
          ...baseTournament,
          status: TournamentStatus.ACTIVE,
        }}
      />
    );

    expect(
      screen.queryByRole('button', { name: /join tournament/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders safely with minimal data', () => {
    expect(() =>
      renderWithTheme(
        <TournamentCard
          tournament={{
            id: 'minimal',
            name: 'Minimal Cup',
            startDate: '2024-01-05T10:00:00Z',
            location: 'Downtown Dojo',
            maxParticipants: 8,
            currentParticipants: 0,
            entryFee: 0,
            prizePool: 0,
            status: TournamentStatus.REGISTRATION,
            participants: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }}
          onJoin={vi.fn()}
          onView={vi.fn()}
        />
      )
    ).not.toThrow();
  });
});
