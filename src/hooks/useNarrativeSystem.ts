import { useState, useEffect, useCallback } from 'react';
import { NarrativeEventSystem, NarrativeEvent, Character, StoryArc, WorldState } from '../services/narrative/NarrativeEventSystem';
import { useWebSocket } from './useWebSocket';

export interface NarrativeState {
  activeEvents: NarrativeEvent[];
  characters: Character[];
  storyArcs: StoryArc[];
  worldState: WorldState;
  currentDialogue: {
    character: Character | null;
    content: string;
    emotion: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export const useNarrativeSystem = (userId: string) => {
  const [state, setState] = useState<NarrativeState>({
    activeEvents: [],
    characters: [],
    storyArcs: [],
    worldState: {
      currentLocation: 'dojo_entrance',
      activeEvents: [],
      characterLocations: new Map(),
      worldFlags: new Map(),
      timeOfDay: 'morning',
      weather: 'clear',
      specialEvents: []
    },
    currentDialogue: null,
    isLoading: true,
    error: null
  });

  const { socket } = useWebSocket();
  const narrativeSystem = new NarrativeEventSystem();

  // Load initial narrative state
  const loadNarrativeState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const activeArcs = narrativeSystem.getActiveStoryArcs(userId);
      const allCharacters = narrativeSystem.getAllCharacters();
      const worldState = narrativeSystem.getWorldState();

      setState(prev => ({
        ...prev,
        storyArcs: activeArcs,
        characters: allCharacters,
        worldState,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, [userId, narrativeSystem]);

  // Trigger a game event
  const triggerGameEvent = useCallback(async (eventType: string, eventData: any) => {
    try {
      await narrativeSystem.processGameEvent(userId, eventType, eventData);

      // Update state after event processing
      const activeArcs = narrativeSystem.getActiveStoryArcs(userId);
      const worldState = narrativeSystem.getWorldState();

      setState(prev => ({
        ...prev,
        storyArcs: activeArcs,
        worldState
      }));

      // Emit socket event for real-time updates
      socket?.emit('narrative:game_event', {
        userId,
        eventType,
        eventData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error triggering game event:', error);
    }
  }, [userId, narrativeSystem, socket]);

  // Start a story arc
  const startStoryArc = useCallback(async (arcId: string) => {
    try {
      // Trigger a game event to start the arc
      await triggerGameEvent('story_arc_start', { arcId });
    } catch (error) {
      console.error('Error starting story arc:', error);
    }
  }, [triggerGameEvent]);

  // Advance a story arc
  const advanceStoryArc = useCallback(async (arcId: string) => {
    try {
      // Trigger a game event to advance the arc
      await triggerGameEvent('story_arc_advance', { arcId });
    } catch (error) {
      console.error('Error advancing story arc:', error);
    }
  }, [triggerGameEvent]);

  // Interact with a character
  const interactWithCharacter = useCallback(async (characterId: string) => {
    try {
      const character = state.characters.find(c => c.id === characterId);
      if (!character) return;

      // Trigger character interaction event
      await triggerGameEvent('character_interaction', {
        characterId,
        characterName: character.name,
        location: state.worldState.currentLocation
      });

      // Find appropriate dialogue
      const dialogue = character.dialogue[0]; // Simplified - would be more sophisticated
      if (dialogue) {
        setState(prev => ({
          ...prev,
          currentDialogue: {
            character,
            content: dialogue.content,
            emotion: dialogue.emotion
          }
        }));
      }
    } catch (error) {
      console.error('Error interacting with character:', error);
    }
  }, [state.characters, state.worldState.currentLocation, triggerGameEvent]);

  // Change location
  const changeLocation = useCallback(async (newLocation: string) => {
    try {
      await triggerGameEvent('location_change', { location: newLocation });
    } catch (error) {
      console.error('Error changing location:', error);
    }
  }, [triggerGameEvent]);

  // Clear current dialogue
  const clearDialogue = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentDialogue: null
    }));
  }, []);

  // Get characters at current location
  const getCharactersAtCurrentLocation = useCallback(() => {
    return state.characters.filter(char => 
      char.currentLocation === state.worldState.currentLocation && char.isActive
    );
  }, [state.characters, state.worldState.currentLocation]);

  // Get active story arc
  const getActiveStoryArc = useCallback(() => {
    return state.storyArcs.find(arc => arc.isActive && !arc.isCompleted);
  }, [state.storyArcs]);

  // Check if location has characters
  const hasCharactersAtLocation = useCallback((location: string) => {
    return state.characters.some(char => 
      char.currentLocation === location && char.isActive
    );
  }, [state.characters]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNarrativeEvent = (data: any) => {
      if (data.userId === userId) {
        // Update narrative state based on event
        const activeArcs = narrativeSystem.getActiveStoryArcs(userId);
        const worldState = narrativeSystem.getWorldState();

        setState(prev => ({
          ...prev,
          storyArcs: activeArcs,
          worldState
        }));
      }
    };

    const handleCharacterInteraction = (data: any) => {
      if (data.userId === userId) {
        const character = state.characters.find(c => c.id === data.characterId);
        if (character) {
          setState(prev => ({
            ...prev,
            currentDialogue: {
              character,
              content: data.dialogue,
              emotion: data.emotion
            }
          }));
        }
      }
    };

    const handleWorldStateUpdate = (data: any) => {
      if (data.userId === userId) {
        setState(prev => ({
          ...prev,
          worldState: data.worldState
        }));
      }
    };

    socket.on('narrative:event', handleNarrativeEvent);
    socket.on('narrative:character_interaction', handleCharacterInteraction);
    socket.on('narrative:world_state_update', handleWorldStateUpdate);

    return () => {
      socket.off('narrative:event', handleNarrativeEvent);
      socket.off('narrative:character_interaction', handleCharacterInteraction);
      socket.off('narrative:world_state_update', handleWorldStateUpdate);
    };
  }, [socket, userId, narrativeSystem, state.characters]);

  // Load initial state on mount
  useEffect(() => {
    loadNarrativeState();
  }, [loadNarrativeState]);

  return {
    ...state,
    triggerGameEvent,
    startStoryArc,
    advanceStoryArc,
    interactWithCharacter,
    changeLocation,
    clearDialogue,
    getCharactersAtCurrentLocation,
    getActiveStoryArc,
    hasCharactersAtLocation,
    reload: loadNarrativeState
  };
}; 