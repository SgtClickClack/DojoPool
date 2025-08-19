import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

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
import { CurrentUserService } from '../../../apps/web/src/services/CurrentUserService';
import { ChallengeService } from '../../../apps/web/src/services/ChallengeService';

beforeEach(() => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
  }
});

describe('DojoInterior Challenge Player flow', () => {
  it('allows a checked-in user to select another active player and send a challenge', async () => {
    // Arrange current user and an opponent present in dojo
    CurrentUserService.setCurrentUser({
      id: 'user-1',
      username: 'RyuKlaw',
      avatarUrl: 'https://via.placeholder.com/40x40/ff6b6b/ffffff?text=RK',
    });

    const opponent = {
      id: 'user-2',
      username: 'ShadowStriker',
      avatarUrl: 'https://via.placeholder.com/40x40/00ccff/ffffff?text=SS',
    };

    // Opponent is already checked in
    DojoPresenceService.checkIn('dojo-1', opponent);

    render(<DojoInterior dojoId="dojo-1" onExit={() => {}} />);

    // Check in current user
    const checkInButton = await screen.findByRole('button', { name: /check in/i });
    fireEvent.click(checkInButton);

    // Open Challenge modal
    const challengeBtn = await screen.findByRole('button', { name: /challenge player/i });
    fireEvent.click(challengeBtn);

    // Select the opponent by name
    const opponentButton = await screen.findByRole('button', { name: /shadowstriker/i });
    fireEvent.click(opponentButton);

    // Send the challenge
    const sendBtn = await screen.findByRole('button', { name: /send challenge/i });
    fireEvent.click(sendBtn);

    // Success message appears
    expect(await screen.findByText(/challenge sent to shadowstriker/i)).toBeInTheDocument();

    // And the challenge is persisted
    const challenges = ChallengeService.getActiveChallenges('dojo-1');
    expect(challenges.length).toBe(1);
    expect(challenges[0]).toMatchObject({ defenderId: 'user-2', challengerId: 'user-1' });
  });
});
