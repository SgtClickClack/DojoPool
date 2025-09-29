import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/components/__tests__/test-utils';
import MobileTournamentCard from '../MobileTournamentCard';

vi.mock('framer-motion', () => {
  const MockComponent = ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  );

  return {
    __esModule: true,
    motion: new Proxy(
      {},
      {
        get: () => MockComponent,
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const baseTournament = {
  id: 'tournament-1',
  name: 'Cyber Clash',
  description: 'Night-long tournament under neon lights.',
  status: 'upcoming' as const,
  startDate: new Date('2024-01-01T10:00:00Z'),
  endDate: new Date('2024-01-02T02:00:00Z'),
  maxParticipants: 16,
  currentParticipants: 8,
  prizePool: 1000,
  venueName: 'Shinjuku Dojo',
  venueAddress: '123 Dojo Lane',
  entryFee: 100,
  gameType: '8-ball',
  difficulty: 'intermediate' as const,
};

const onRegister = vi.fn();
const onViewDetails = vi.fn();
const onJoinGame = vi.fn();
const onSpectate = vi.fn();

describe('MobileTournamentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCard = (overrides: Partial<React.ComponentProps<typeof MobileTournamentCard>> = {}) =>
    render(
      <MobileTournamentCard
        tournament={baseTournament}
        onRegister={onRegister}
        onViewDetails={onViewDetails}
        onJoinGame={onJoinGame}
        onSpectate={onSpectate}
        {...overrides}
      />
    );

  it('renders core tournament information', () => {
    renderCard();

    expect(screen.getByText('Cyber Clash')).toBeInTheDocument();
    expect(screen.getByText(/Prize Pool/i)).toBeInTheDocument();
    expect(screen.getByText(/Players/i)).toBeInTheDocument();
    expect(screen.getByText(/Register Now/i)).toBeInTheDocument();
  });

  it('invokes register callback', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /register now/i }));
    expect(onRegister).toHaveBeenCalledWith('tournament-1');
  });

  it('renders join actions when active and registered', () => {
    renderCard({
      tournament: { ...baseTournament, status: 'active' },
      isRegistered: true,
    });

    fireEvent.click(screen.getByRole('button', { name: /join game/i }));
    expect(onJoinGame).toHaveBeenCalledWith('tournament-1');

    fireEvent.click(screen.getByRole('button', { name: /spectate/i }));
    expect(onSpectate).toHaveBeenCalledWith('tournament-1');
  });

  it('shows completed state actions', () => {
    renderCard({ tournament: { ...baseTournament, status: 'completed' } });

    expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument();
  });

  it('expands details and triggers view action', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /expand details/i }));
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));

    expect(onViewDetails).toHaveBeenCalledWith('tournament-1');
  });
});
