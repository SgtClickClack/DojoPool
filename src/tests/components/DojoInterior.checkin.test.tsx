import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the map data hook to return a dojo immediately
vi.mock('../../../apps/web/src/hooks/useMapData', () => {
  return {
    useMapData: () => ({
      players: [],
      dojos: [
        {
          id: 'dojo-1',
          name: 'The Jade Tiger',
          controllingClan: 'Crimson Monkey',
          clanLogoUrl: 'https://via.placeholder.com/60x60/ff6b6b/ffffff?text=CM',
          coordinates: [153.0251, -27.4698],
          address: '123 Pool Street, Brisbane',
          level: 5,
          isActive: true,
        },
      ],
      dojoVenues: [],
      activeMatches: [],
      territories: [],
      isLoading: false,
      error: null,
    }),
  };
});

import DojoInterior from '../../../apps/web/src/components/dojo/DojoInterior';
import { DojoPresenceService } from '../../../apps/web/src/services/DojoPresenceService';

describe('DojoInterior Check In Button', () => {
  it('allows user to check in and updates UI state', async () => {
    const spyCheckIn = vi.spyOn(DojoPresenceService, 'checkIn');

    render(<DojoInterior dojoId="dojo-1" onExit={() => {}} />);

    // The Check In button should be visible initially
    const checkInButton = await screen.findByRole('button', { name: /check in/i });
    expect(checkInButton).toBeInTheDocument();

    // Click the Check In button
    fireEvent.click(checkInButton);

    // Service should have been called with dojoId and a user object
    expect(spyCheckIn).toHaveBeenCalledTimes(1);
    const [calledDojoId, calledUser] = spyCheckIn.mock.calls[0];
    expect(calledDojoId).toBe('dojo-1');
    expect(calledUser).toBeTruthy();

    // UI should reflect checked in state
    expect(await screen.findByText(/checked in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check out/i })).toBeInTheDocument();
  });
});
