import { GameStateService, GameState } from '../GameStateService';
import { EventEmitter } from 'events';

// Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn()
  }))
}));

describe('GameStateService', () => {
  let gameStateService: GameStateService;
  let mockSocket: any;

  beforeEach(() => {
    // Reset the socket mock
    const { io } = require('socket.io-client');
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn()
    };
    (io as jest.Mock).mockReturnValue(mockSocket);

    gameStateService = new GameStateService();
  });

  afterEach(() => {
    gameStateService.disconnect();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default game state', () => {
      const gameState = gameStateService.getGameState();
      
      expect(gameState.playerId).toBe('player-1');
      expect(gameState.currentLocation.latitude).toBe(-27.4698);
      expect(gameState.currentLocation.longitude).toBe(153.0251);
      expect(gameState.currentLocation.dojoId).toBe('dojo-1');
      expect(gameState.isTraveling).toBe(false);
      expect(gameState.activeChallenges).toEqual([]);
      expect(gameState.territoryControl.controlledDojos).toEqual([]);
      expect(gameState.territoryControl.influence).toBe(0);
      expect(gameState.territoryControl.clanId).toBe('clan-1');
      expect(gameState.matchState.isInMatch).toBe(false);
    });

    it('should initialize socket connection', () => {
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('game_state_update', expect.any(Function));
    });

    it('should extend EventEmitter', () => {
      expect(gameStateService).toBeInstanceOf(EventEmitter);
    });
  });

  describe('Game State Management', () => {
    it('should update game state and emit event', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const updates = {
        playerId: 'new-player-1',
        isTraveling: true
      };

      gameStateService.updateGameState(updates);

      const updatedState = gameStateService.getGameState();
      expect(updatedState.playerId).toBe('new-player-1');
      expect(updatedState.isTraveling).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('gameStateUpdated', updatedState);
    });

    it('should preserve existing state when updating', () => {
      const originalState = gameStateService.getGameState();
      const updates = { isTraveling: true };

      gameStateService.updateGameState(updates);

      const updatedState = gameStateService.getGameState();
      expect(updatedState.playerId).toBe(originalState.playerId);
      expect(updatedState.currentLocation).toEqual(originalState.currentLocation);
      expect(updatedState.isTraveling).toBe(true);
    });
  });

  describe('Player Location Management', () => {
    it('should update player location', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const newLat = -27.5000;
      const newLng = 153.1000;
      const newDojoId = 'dojo-2';

      gameStateService.updatePlayerLocation(newLat, newLng, newDojoId);

      const location = gameStateService.getCurrentLocation();
      expect(location.latitude).toBe(newLat);
      expect(location.longitude).toBe(newLng);
      expect(location.dojoId).toBe(newDojoId);
      expect(emitSpy).toHaveBeenCalledWith('locationUpdated', location);
    });

    it('should update location without dojoId', () => {
      const newLat = -27.5000;
      const newLng = 153.1000;

      gameStateService.updatePlayerLocation(newLat, newLng);

      const location = gameStateService.getCurrentLocation();
      expect(location.latitude).toBe(newLat);
      expect(location.longitude).toBe(newLng);
      expect(location.dojoId).toBeUndefined();
    });

    it('should return current location', () => {
      const location = gameStateService.getCurrentLocation();
      
      expect(location).toEqual({
        latitude: -27.4698,
        longitude: 153.0251,
        dojoId: 'dojo-1'
      });
    });
  });

  describe('Travel State Management', () => {
    it('should set traveling state with destination', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const destination = {
        dojoId: 'dojo-2',
        dojoName: 'Test Dojo',
        latitude: -27.5000,
        longitude: 153.1000,
        estimatedArrival: new Date()
      };

      gameStateService.setTravelingState(true, destination);

      const gameState = gameStateService.getGameState();
      expect(gameState.isTraveling).toBe(true);
      expect(gameState.destination).toEqual(destination);
      expect(emitSpy).toHaveBeenCalledWith('travelStateUpdated', { 
        isTraveling: true, 
        destination 
      });
    });

    it('should clear traveling state', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      
      // First set traveling
      gameStateService.setTravelingState(true, { dojoId: 'test' } as any);
      
      // Then clear it
      gameStateService.setTravelingState(false);

      const gameState = gameStateService.getGameState();
      expect(gameState.isTraveling).toBe(false);
      expect(gameState.destination).toBeUndefined();
      expect(emitSpy).toHaveBeenLastCalledWith('travelStateUpdated', { 
        isTraveling: false, 
        destination: undefined 
      });
    });

    it('should return traveling status', () => {
      expect(gameStateService.isTraveling()).toBe(false);
      
      gameStateService.setTravelingState(true);
      expect(gameStateService.isTraveling()).toBe(true);
    });
  });

  describe('Match State Management', () => {
    it('should update match state', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const matchState = {
        isInMatch: true,
        matchId: 'match-123',
        opponentId: 'opponent-1',
        dojoId: 'dojo-1',
        startTime: new Date(),
        score: { player: 5, opponent: 3 }
      };

      gameStateService.updateMatchState(matchState);

      const gameState = gameStateService.getGameState();
      expect(gameState.matchState).toEqual(matchState);
      expect(emitSpy).toHaveBeenCalledWith('matchStateUpdated', matchState);
    });

    it('should partially update match state', () => {
      // Set initial match state
      gameStateService.updateMatchState({
        isInMatch: true,
        matchId: 'match-123',
        opponentId: 'opponent-1'
      });

      // Partially update
      gameStateService.updateMatchState({
        score: { player: 5, opponent: 3 }
      });

      const gameState = gameStateService.getGameState();
      expect(gameState.matchState.isInMatch).toBe(true);
      expect(gameState.matchState.matchId).toBe('match-123');
      expect(gameState.matchState.score).toEqual({ player: 5, opponent: 3 });
    });

    it('should return match status', () => {
      expect(gameStateService.isInMatch()).toBe(false);
      
      gameStateService.updateMatchState({ isInMatch: true });
      expect(gameStateService.isInMatch()).toBe(true);
    });
  });

  describe('Challenge Management', () => {
    it('should add active challenge', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const challenge = {
        id: 'challenge-1',
        type: 'pilgrimage',
        challengerId: 'player-1',
        defenderId: 'player-2',
        dojoId: 'dojo-1'
      };

      gameStateService.addActiveChallenge(challenge);

      const gameState = gameStateService.getGameState();
      expect(gameState.activeChallenges).toContain(challenge);
      expect(emitSpy).toHaveBeenCalledWith('challengeAdded', challenge);
    });

    it('should remove active challenge', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const challenge1 = { id: 'challenge-1', type: 'pilgrimage' };
      const challenge2 = { id: 'challenge-2', type: 'gauntlet' };

      // Add challenges
      gameStateService.addActiveChallenge(challenge1);
      gameStateService.addActiveChallenge(challenge2);

      // Remove one challenge
      gameStateService.removeActiveChallenge('challenge-1');

      const gameState = gameStateService.getGameState();
      expect(gameState.activeChallenges).toHaveLength(1);
      expect(gameState.activeChallenges[0].id).toBe('challenge-2');
      expect(emitSpy).toHaveBeenCalledWith('challengeRemoved', 'challenge-1');
    });

    it('should handle removing non-existent challenge', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      
      gameStateService.removeActiveChallenge('non-existent');

      const gameState = gameStateService.getGameState();
      expect(gameState.activeChallenges).toHaveLength(0);
      expect(emitSpy).toHaveBeenCalledWith('challengeRemoved', 'non-existent');
    });
  });

  describe('Territory Control Management', () => {
    it('should update territory control', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const updates = {
        controlledDojos: ['dojo-1', 'dojo-2'],
        influence: 150,
        clanId: 'new-clan'
      };

      gameStateService.updateTerritoryControl(updates);

      const gameState = gameStateService.getGameState();
      expect(gameState.territoryControl).toEqual(updates);
      expect(emitSpy).toHaveBeenCalledWith('territoryControlUpdated', updates);
    });

    it('should partially update territory control', () => {
      const initialControl = gameStateService.getGameState().territoryControl;
      
      gameStateService.updateTerritoryControl({ influence: 200 });

      const gameState = gameStateService.getGameState();
      expect(gameState.territoryControl.influence).toBe(200);
      expect(gameState.territoryControl.controlledDojos).toEqual(initialControl.controlledDojos);
      expect(gameState.territoryControl.clanId).toBe(initialControl.clanId);
    });
  });

  describe('Getters', () => {
    it('should return player ID', () => {
      expect(gameStateService.getPlayerId()).toBe('player-1');
      
      gameStateService.updateGameState({ playerId: 'new-player' });
      expect(gameStateService.getPlayerId()).toBe('new-player');
    });

    it('should return immutable game state copy', () => {
      const gameState1 = gameStateService.getGameState();
      const gameState2 = gameStateService.getGameState();
      
      expect(gameState1).not.toBe(gameState2); // Different objects
      expect(gameState1).toEqual(gameState2); // Same content
    });

    it('should return immutable current location copy', () => {
      const location1 = gameStateService.getCurrentLocation();
      const location2 = gameStateService.getCurrentLocation();
      
      expect(location1).not.toBe(location2); // Different objects
      expect(location1).toEqual(location2); // Same content
    });
  });

  describe('Socket Events', () => {
    it('should handle game state update from socket', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      const gameStateUpdate = { playerId: 'updated-player', isTraveling: true };
      
      // Simulate socket event
      const gameStateUpdateHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'game_state_update'
      )[1];
      
      gameStateUpdateHandler(gameStateUpdate);

      const gameState = gameStateService.getGameState();
      expect(gameState.playerId).toBe('updated-player');
      expect(gameState.isTraveling).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('gameStateUpdated', gameState);
    });

    it('should emit connected event on socket connect', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      
      // Simulate socket connect
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      
      connectHandler();

      expect(emitSpy).toHaveBeenCalledWith('connected');
    });

    it('should emit disconnected event on socket disconnect', () => {
      const emitSpy = jest.spyOn(gameStateService, 'emit');
      
      // Simulate socket disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )[1];
      
      disconnectHandler();

      expect(emitSpy).toHaveBeenCalledWith('disconnected');
    });
  });

  describe('Cleanup', () => {
    it('should disconnect socket when disconnect is called', () => {
      gameStateService.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle multiple disconnect calls gracefully', () => {
      gameStateService.disconnect();
      gameStateService.disconnect(); // Should not throw
      
      expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty game state updates', () => {
      const originalState = gameStateService.getGameState();
      
      gameStateService.updateGameState({});
      
      const updatedState = gameStateService.getGameState();
      expect(updatedState).toEqual(originalState);
    });

    it('should handle null/undefined values in updates', () => {
      gameStateService.updateTerritoryControl({ 
        clanId: undefined as any,
        influence: null as any 
      });
      
      const gameState = gameStateService.getGameState();
      expect(gameState.territoryControl.clanId).toBeUndefined();
      expect(gameState.territoryControl.influence).toBeNull();
    });

    it('should maintain array immutability when updating challenges', () => {
      const challenge = { id: 'test', type: 'duel' };
      gameStateService.addActiveChallenge(challenge);
      
      const gameState1 = gameStateService.getGameState();
      const gameState2 = gameStateService.getGameState();
      
      expect(gameState1.activeChallenges).not.toBe(gameState2.activeChallenges);
      expect(gameState1.activeChallenges).toEqual(gameState2.activeChallenges);
    });
  });
});

// Integration tests for service interaction
describe('GameStateService Integration', () => {
  let gameStateService: GameStateService;

  beforeEach(() => {
    gameStateService = new GameStateService();
  });

  afterEach(() => {
    gameStateService.disconnect();
  });

  it('should handle complex state transitions', () => {
    const emitSpy = jest.spyOn(gameStateService, 'emit');
    
    // Simulate a complete game flow
    
    // 1. Player starts traveling
    gameStateService.setTravelingState(true, {
      dojoId: 'dojo-2',
      dojoName: 'Target Dojo',
      latitude: -27.5000,
      longitude: 153.1000,
      estimatedArrival: new Date()
    });
    
    // 2. Player arrives and location updates
    gameStateService.updatePlayerLocation(-27.5000, 153.1000, 'dojo-2');
    gameStateService.setTravelingState(false);
    
    // 3. Player receives a challenge
    gameStateService.addActiveChallenge({
      id: 'challenge-1',
      type: 'pilgrimage',
      challengerId: 'opponent-1'
    });
    
    // 4. Player accepts and starts match
    gameStateService.removeActiveChallenge('challenge-1');
    gameStateService.updateMatchState({
      isInMatch: true,
      matchId: 'match-1',
      opponentId: 'opponent-1',
      dojoId: 'dojo-2'
    });
    
    // 5. Player wins and claims territory
    gameStateService.updateMatchState({ isInMatch: false });
    gameStateService.updateTerritoryControl({
      controlledDojos: ['dojo-1', 'dojo-2'],
      influence: 150
    });
    
    // Verify final state
    const finalState = gameStateService.getGameState();
    expect(finalState.isTraveling).toBe(false);
    expect(finalState.currentLocation.dojoId).toBe('dojo-2');
    expect(finalState.activeChallenges).toHaveLength(0);
    expect(finalState.matchState.isInMatch).toBe(false);
    expect(finalState.territoryControl.controlledDojos).toContain('dojo-2');
    expect(finalState.territoryControl.influence).toBe(150);
    
    // Verify all events were emitted
    expect(emitSpy).toHaveBeenCalledWith('travelStateUpdated', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('locationUpdated', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('challengeAdded', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('challengeRemoved', 'challenge-1');
    expect(emitSpy).toHaveBeenCalledWith('matchStateUpdated', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('territoryControlUpdated', expect.any(Object));
  });
});