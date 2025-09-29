import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/components/__tests__/test-utils';
import MobileWorldMap from '../MobileWorldMap';

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

const defaultDojos = [
  {
    id: 'dojo-1',
    name: 'Jade Tiger',
    location: {
      lat: -37.8136,
      lng: 144.9631,
      address: '123 Collins Street, Melbourne',
    },
    owner: {
      name: 'Master Chen',
      level: 15,
      avatar: '🐯',
    },
    stats: {
      activePlayers: 8,
      prizePool: 250,
      difficulty: 'medium' as const,
      rating: 4.5,
    },
    status: 'available' as const,
    distance: 500,
  },
];

describe('MobileWorldMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map header and search input', () => {
    render(<MobileWorldMap dojos={defaultDojos} />);

    expect(screen.getByRole('heading', { name: 'World Map' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search dojos...')).toBeInTheDocument();
  });

  it('opens dojo details when a marker is selected', () => {
    render(<MobileWorldMap dojos={defaultDojos} />);

    fireEvent.click(screen.getByLabelText(/Open details for Jade Tiger/i));

    expect(screen.getByText(/Owned by Master Chen/)).toBeInTheDocument();
    expect(screen.getByText(/Active Players/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /challenge/i })).toBeInTheDocument();
  });

  it('renders empty state messaging when no dojos are available', () => {
    render(<MobileWorldMap dojos={[]} />);

    expect(screen.getByText(/No dojos found/i)).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search/i)).toBeInTheDocument();
  });
});
