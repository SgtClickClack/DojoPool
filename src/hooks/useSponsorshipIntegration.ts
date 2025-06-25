import { useEffect, useCallback } from 'react';
import { SponsorshipBracketService } from '../services/sponsorship/SponsorshipBracketService';

interface GameEvent {
  type: 'game_win' | 'trick_shot' | 'tournament_win' | 'level_up' | 'venue_capture';
  data: Record<string, any>;
}

interface UseSponsorshipIntegrationProps {
  playerId: string;
  onBracketUnlocked?: (bracketIds: string[]) => void;
  onChallengeCompleted?: (bracketId: string, challengeId: string) => void;
  onBracketCompleted?: (bracketId: string) => void;
}

export const useSponsorshipIntegration = ({
  playerId,
  onBracketUnlocked,
  onChallengeCompleted,
  onBracketCompleted,
}: UseSponsorshipIntegrationProps) => {
  
  // Process game events for sponsorship challenges
  const processGameEvent = useCallback(async (event: GameEvent) => {
    try {
      await SponsorshipBracketService.processGameEvent(playerId, event.type, event.data);
    } catch (error) {
      console.error('Error processing sponsorship game event:', error);
    }
  }, [playerId]);

  // Handle player level up events
  const handleLevelUp = useCallback(async (newLevel: number) => {
    try {
      // Check for newly unlocked brackets
      const unlockedBrackets = await SponsorshipBracketService.checkAndUnlockBrackets(playerId, newLevel);
      
      if (unlockedBrackets.length > 0 && onBracketUnlocked) {
        onBracketUnlocked(unlockedBrackets.map(b => b.bracketId));
      }

      // Process level up event for existing challenges
      await processGameEvent({
        type: 'level_up',
        data: { newLevel },
      });
    } catch (error) {
      console.error('Error handling level up for sponsorship:', error);
    }
  }, [playerId, onBracketUnlocked, processGameEvent]);

  // Handle game win events
  const handleGameWin = useCallback(async (gameData: {
    gameId: string;
    opponentId: string;
    score: { player: number; opponent: number };
    gameType: string;
    accuracy?: number;
    duration?: number;
  }) => {
    await processGameEvent({
      type: 'game_win',
      data: {
        gameId: gameData.gameId,
        opponentId: gameData.opponentId,
        score: gameData.score,
        gameType: gameData.gameType,
        accuracy: gameData.accuracy,
        duration: gameData.duration,
      },
    });
  }, [processGameEvent]);

  // Handle trick shot events
  const handleTrickShot = useCallback(async (shotData: {
    shotType: string;
    difficulty: string;
    accuracy: number;
    gameId?: string;
  }) => {
    await processGameEvent({
      type: 'trick_shot',
      data: shotData,
    });
  }, [processGameEvent]);

  // Handle tournament win events
  const handleTournamentWin = useCallback(async (tournamentData: {
    tournamentId: string;
    tournamentType: string;
    participantCount: number;
    venueId?: string;
  }) => {
    await processGameEvent({
      type: 'tournament_win',
      data: tournamentData,
    });
  }, [processGameEvent]);

  // Handle venue capture events
  const handleVenueCapture = useCallback(async (venueData: {
    venueId: string;
    venueType: string;
    previousOwner?: string;
    captureMethod: string;
  }) => {
    await processGameEvent({
      type: 'venue_capture',
      data: venueData,
    });
  }, [processGameEvent]);

  // Set up event listeners for game events
  useEffect(() => {
    const handleGameEvent = (event: CustomEvent<GameEvent>) => {
      processGameEvent(event.detail);
    };

    // Listen for custom game events
    window.addEventListener('dojopool:game_win', handleGameEvent as EventListener);
    window.addEventListener('dojopool:trick_shot', handleGameEvent as EventListener);
    window.addEventListener('dojopool:tournament_win', handleGameEvent as EventListener);
    window.addEventListener('dojopool:level_up', handleGameEvent as EventListener);
    window.addEventListener('dojopool:venue_capture', handleGameEvent as EventListener);

    return () => {
      window.removeEventListener('dojopool:game_win', handleGameEvent as EventListener);
      window.removeEventListener('dojopool:trick_shot', handleGameEvent as EventListener);
      window.removeEventListener('dojopool:tournament_win', handleGameEvent as EventListener);
      window.removeEventListener('dojopool:level_up', handleGameEvent as EventListener);
      window.removeEventListener('dojopool:venue_capture', handleGameEvent as EventListener);
    };
  }, [processGameEvent]);

  return {
    processGameEvent,
    handleLevelUp,
    handleGameWin,
    handleTrickShot,
    handleTournamentWin,
    handleVenueCapture,
  };
};

// Helper function to emit game events that can be picked up by the sponsorship system
export const emitGameEvent = (type: GameEvent['type'], data: Record<string, any>) => {
  const event = new CustomEvent(`dojopool:${type}`, {
    detail: { type, data },
  });
  window.dispatchEvent(event);
};

// Integration helper for existing game components
export const integrateSponsorshipEvents = {
  // Call this when a player wins a game
  gameWin: (gameData: {
    gameId: string;
    opponentId: string;
    score: { player: number; opponent: number };
    gameType: string;
    accuracy?: number;
    duration?: number;
  }) => {
    emitGameEvent('game_win', gameData);
  },

  // Call this when a player performs a trick shot
  trickShot: (shotData: {
    shotType: string;
    difficulty: string;
    accuracy: number;
    gameId?: string;
  }) => {
    emitGameEvent('trick_shot', shotData);
  },

  // Call this when a player wins a tournament
  tournamentWin: (tournamentData: {
    tournamentId: string;
    tournamentType: string;
    participantCount: number;
    venueId?: string;
  }) => {
    emitGameEvent('tournament_win', tournamentData);
  },

  // Call this when a player levels up
  levelUp: (newLevel: number) => {
    emitGameEvent('level_up', { newLevel });
  },

  // Call this when a player captures a venue
  venueCapture: (venueData: {
    venueId: string;
    venueType: string;
    previousOwner?: string;
    captureMethod: string;
  }) => {
    emitGameEvent('venue_capture', venueData);
  },
};