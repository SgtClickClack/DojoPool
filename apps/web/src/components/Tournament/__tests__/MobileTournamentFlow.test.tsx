import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/components/__tests__/test-utils';

vi.mock('framer-motion', () => {
  const MockComponent = ({ children }: any) => <div>{children}</div>;

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

vi.mock('../MobileTournamentCard', async () => {
  const actual = await vi.importActual('../MobileTournamentCard');
  return actual;
});

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

import MobileTournamentFlow from '../MobileTournamentFlow';

const tournaments = [
  {
    id: '1',
    name: 'Friday Night Showdown',
    type: 'single-elimination' as const,
    status: 'upcoming' as const,
    startTime: new Date(),
    entryFee: 50,
    prizePool: 1000,
    maxParticipants: 16,
    currentParticipants: 12,
    venue: 'Jade Tiger',
    difficulty: 'intermediate' as const,
    description: 'Weekly tournament for intermediate players',
  },
  {
    id: '2',
    name: 'Championship Series',
    type: 'single-elimination' as const,
    status: 'active' as const,
    startTime: new Date(),
    entryFee: 100,
    prizePool: 2500,
    maxParticipants: 32,
    currentParticipants: 32,
    venue: 'Pool Palace',
    difficulty: 'advanced' as const,
    description: 'Monthly championship for top players',
  },
];

describe('MobileTournamentFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and search controls', () => {
    render(<MobileTournamentFlow tournaments={tournaments} />);

    expect(screen.getByRole('heading', { name: /Tournaments/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search tournaments/i)).toBeInTheDocument();
  });

  it('filters tournaments by search input', () => {
    render(<MobileTournamentFlow tournaments={tournaments} />);

    expect(screen.getByText('Friday Night Showdown')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search tournaments/i), {
      target: { value: 'Championship' },
    });

    expect(screen.queryByText('Friday Night Showdown')).not.toBeInTheDocument();
    expect(screen.getByText('Championship Series')).toBeInTheDocument();
  });

  it('displays empty state when no tournaments match', async () => {
    render(<MobileTournamentFlow tournaments={[]} />);

    expect(await screen.findByText(/No tournaments found/i)).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search/i)).toBeInTheDocument();
  });
});
