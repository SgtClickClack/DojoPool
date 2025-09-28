import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VenueCard from '../VenueCard';
import type { Venue } from '@/types/venue';

const createVenue = (overrides: Partial<Venue> = {}): Venue => ({
  id: overrides.id ?? 'venue-1',
  name: overrides.name ?? 'Jade Tiger Hall',
  description: overrides.description ?? 'Cyberpunk bar with precision tables.',
  address: overrides.address ?? {
    street: '123 Neon Ave',
    city: 'Shibuya',
    state: 'Tokyo',
    postalCode: '150-0002',
    coordinates: {
      latitude: 35.6595,
      longitude: 139.7005,
    },
  },
  status: overrides.status ?? 'ACTIVE',
  tables: overrides.tables ?? [],
  images: overrides.images ?? [],
  rating: overrides.rating,
  reviewCount: overrides.reviewCount ?? 0,
  features: overrides.features ?? ['TOURNAMENTS', 'FOOD'],
  amenities: overrides.amenities ?? [],
  isVerified: overrides.isVerified ?? true,
  hours: overrides.hours ?? [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('VenueCard', () => {
  const onClick = vi.fn();
  const onUpgrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders key venue details', () => {
    render(
      <VenueCard
        venue={createVenue({
          rating: 4.3,
          reviews: [
            {
              id: 'r1',
              venueId: 'venue-1',
              rating: 4,
              comment: 'Great vibe',
              createdAt: '',
              updatedAt: '',
            },
          ],
          tables: [
            {
              id: 't1',
              venueId: 'venue-1',
              tableNumber: 1,
              status: 'AVAILABLE',
              players: 0,
              maxPlayers: 4,
              currentGame: null,
              createdAt: '',
              updatedAt: '',
            },
          ],
        })}
      />
    );

    expect(screen.getByText('Jade Tiger Hall')).toBeInTheDocument();
    expect(
      screen.getByText('123 Neon Ave, Shibuya, Tokyo, 150-0002')
    ).toBeInTheDocument();
    expect(screen.getByText('Tables')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('🏆 Tournaments')).toBeInTheDocument();
    expect(screen.getByText('🍕 Food')).toBeInTheDocument();
  });

  it('shows a placeholder image when no images are provided', () => {
    render(<VenueCard venue={createVenue()} />);

    expect(screen.getByText('🏓')).toBeInTheDocument();
  });

  it('renders status and rating when available', () => {
    render(<VenueCard venue={createVenue({ rating: 4.8 })} />);

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/★★★★☆\s+4\.8/)).toBeInTheDocument();
  });

  it('renders feature pills when provided', () => {
    render(
      <VenueCard
        venue={createVenue({ features: ['TOURNAMENTS', 'BAR', 'PARKING'] })}
      />
    );

    expect(screen.getByText('🍺 Bar')).toBeInTheDocument();
    expect(screen.getByText('🚗 Parking')).toBeInTheDocument();
  });

  it('handles card click callbacks', () => {
    render(<VenueCard venue={createVenue()} onClick={onClick} />);

    fireEvent.click(screen.getByText('Jade Tiger Hall'));
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'venue-1' })
    );
  });

  it('renders upgrade control for leaders', () => {
    render(<VenueCard venue={createVenue()} isLeader onUpgrade={onUpgrade} />);

    fireEvent.click(screen.getByRole('button', { name: /upgrade/i }));
    expect(onUpgrade).toHaveBeenCalledWith('venue-1');
  });
});
