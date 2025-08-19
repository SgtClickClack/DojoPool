import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import UserStats from '@/components/user/UserStats';

// Mock the service that the component uses internally
vi.mock('@/services/userStats', () => ({
  getUserStatsWithRings: vi.fn(async () => ({
    name: 'Alex The Breaker',
    rings: [
      { id: 'r1', name: 'Bronze Ring', color: '#cd7f32' },
      { id: 'r2', name: 'Silver Ring', color: '#c0c0c0' },
      { id: 'r3', name: 'Gold Ring', color: '#ffd700' },
    ],
  })),
}));

describe('UserStats component', () => {
  it('fetches and displays the user\'s name, total rings, and ring visuals', async () => {
    render(<UserStats />);

    // Name
    const name = await screen.findByRole('heading', { name: 'Alex The Breaker' });
    expect(name).toBeInTheDocument();

    // Total rings
    expect(screen.getByText(/Total Rings:/)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('3'))).toBeInTheDocument();

    // Ring visuals
    const ringContainer = screen.getByLabelText('Cue Rings');
    const utils = within(ringContainer);
    expect(utils.getByTestId('ring-r1')).toBeInTheDocument();
    expect(utils.getByTestId('ring-r2')).toBeInTheDocument();
    expect(utils.getByTestId('ring-r3')).toBeInTheDocument();

    // Also verify aria-labels for accessibility
    expect(utils.getByRole('img', { name: /Bronze Ring/ })).toBeInTheDocument();
    expect(utils.getByRole('img', { name: /Silver Ring/ })).toBeInTheDocument();
    expect(utils.getByRole('img', { name: /Gold Ring/ })).toBeInTheDocument();
  });
});
