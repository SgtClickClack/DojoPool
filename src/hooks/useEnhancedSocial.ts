import { useState, useEffect, useCallback } from 'react';
import EnhancedSocialCommunityService, {
  PlayerReputation,
  CommunityChallenge,
  SocialGroup,
  SocialEvent,
  ChallengeParticipant,
  ChallengeSubmission,
  EventAttendee,
  ReputationEvent
} from '../services/social/EnhancedSocialCommunityService';

interface UseEnhancedSocialReturn {
  // Reputation
  reputation: PlayerReputation | null;
  loadingReputation: boolean;
  getReputation: (userId: string) => Promise<void>;
  addReputationEvent: (userId: string, event: Omit<ReputationEvent, 'id' | 'timestamp'>) => Promise<void>;
  
  // Challenges
  challenges: CommunityChallenge[];
  loadingChallenges: boolean;
  createChallenge: (challenge: Omit<CommunityChallenge, 'id' | 'participants' | 'status'>) => Promise<CommunityChallenge>;
  joinChallenge: (challengeId: string, userId: string) => Promise<ChallengeParticipant>;
  submitChallengeEntry: (challengeId: string, userId: string, submission: Omit<ChallengeSubmission, 'id' | 'submittedAt' | 'verified' | 'comments'>) => Promise<ChallengeSubmission>;
  getActiveChallenges: () => void;
  getFeaturedChallenges: () => void;
  
  // Groups
  groups: SocialGroup[];
  loadingGroups: boolean;
  createGroup: (group: Omit<SocialGroup, 'id' | 'members' | 'stats' | 'createdAt' | 'isActive'>) => Promise<SocialGroup>;
  joinGroup: (groupId: string, userId: string) => Promise<void>;
  getGroupsByType: (type: SocialGroup['type']) => void;
  
  // Events
  events: SocialEvent[];
  loadingEvents: boolean;
  createEvent: (event: Omit<SocialEvent, 'id' | 'attendees' | 'status'>) => Promise<SocialEvent>;
  registerForEvent: (eventId: string, userId: string, status?: 'registered' | 'attending' | 'declined' | 'maybe') => Promise<EventAttendee>;
  getUpcomingEvents: () => void;
  getFeaturedEvents: () => void;
  
  // Connection
  isConnected: boolean;
  error: string | null;
  clearError: () => void;
}

export const useEnhancedSocial = (): UseEnhancedSocialReturn => {
  const [reputation, setReputation] = useState<PlayerReputation | null>(null);
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [events, setEvents] = useState<SocialEvent[]>([]);
  
  const [loadingReputation, setLoadingReputation] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhancedSocialService = EnhancedSocialCommunityService.getInstance();

  // Connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(enhancedSocialService.getConnectionStatus());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, [enhancedSocialService]);

  // Event listeners
  useEffect(() => {
    const handleChallengeUpdate = (challenge: CommunityChallenge) => {
      setChallenges(prev => {
        const index = prev.findIndex(c => c.id === challenge.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = challenge;
          return updated;
        }
        return [...prev, challenge];
      });
    };

    const handleGroupUpdate = (group: SocialGroup) => {
      setGroups(prev => {
        const index = prev.findIndex(g => g.id === group.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = group;
          return updated;
        }
        return [...prev, group];
      });
    };

    const handleEventUpdate = (event: SocialEvent) => {
      setEvents(prev => {
        const index = prev.findIndex(e => e.id === event.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = event;
          return updated;
        }
        return [...prev, event];
      });
    };

    enhancedSocialService.on('challenge_updated', handleChallengeUpdate);
    enhancedSocialService.on('group_updated', handleGroupUpdate);
    enhancedSocialService.on('event_updated', handleEventUpdate);

    return () => {
      enhancedSocialService.off('challenge_updated', handleChallengeUpdate);
      enhancedSocialService.off('group_updated', handleGroupUpdate);
      enhancedSocialService.off('event_updated', handleEventUpdate);
    };
  }, [enhancedSocialService]);

  // Reputation methods
  const getReputation = useCallback(async (userId: string) => {
    try {
      setLoadingReputation(true);
      setError(null);
      const userReputation = await enhancedSocialService.getReputation(userId);
      setReputation(userReputation || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reputation');
    } finally {
      setLoadingReputation(false);
    }
  }, [enhancedSocialService]);

  const addReputationEvent = useCallback(async (userId: string, event: Omit<ReputationEvent, 'id' | 'timestamp'>) => {
    try {
      setError(null);
      await enhancedSocialService.addReputationEvent(userId, event);
      // Refresh reputation after adding event
      await getReputation(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reputation event');
    }
  }, [enhancedSocialService, getReputation]);

  // Challenge methods
  const createChallenge = useCallback(async (challenge: Omit<CommunityChallenge, 'id' | 'participants' | 'status'>) => {
    try {
      setError(null);
      const newChallenge = await enhancedSocialService.createChallenge(challenge);
      setChallenges(prev => [...prev, newChallenge]);
      return newChallenge;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
      throw err;
    }
  }, [enhancedSocialService]);

  const joinChallenge = useCallback(async (challengeId: string, userId: string) => {
    try {
      setError(null);
      const participant = await enhancedSocialService.joinChallenge(challengeId, userId);
      return participant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
      throw err;
    }
  }, [enhancedSocialService]);

  const submitChallengeEntry = useCallback(async (challengeId: string, userId: string, submission: Omit<ChallengeSubmission, 'id' | 'submittedAt' | 'verified' | 'comments'>) => {
    try {
      setError(null);
      const challengeSubmission = await enhancedSocialService.submitChallengeEntry(challengeId, userId, submission);
      return challengeSubmission;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit challenge entry');
      throw err;
    }
  }, [enhancedSocialService]);

  const getActiveChallenges = useCallback(() => {
    try {
      setLoadingChallenges(true);
      setError(null);
      const activeChallenges = enhancedSocialService.getActiveChallenges();
      setChallenges(activeChallenges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active challenges');
    } finally {
      setLoadingChallenges(false);
    }
  }, [enhancedSocialService]);

  const getFeaturedChallenges = useCallback(() => {
    try {
      setLoadingChallenges(true);
      setError(null);
      const featuredChallenges = enhancedSocialService.getFeaturedChallenges();
      setChallenges(featuredChallenges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured challenges');
    } finally {
      setLoadingChallenges(false);
    }
  }, [enhancedSocialService]);

  // Group methods
  const createGroup = useCallback(async (group: Omit<SocialGroup, 'id' | 'members' | 'stats' | 'createdAt' | 'isActive'>) => {
    try {
      setError(null);
      const newGroup = await enhancedSocialService.createGroup(group);
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      throw err;
    }
  }, [enhancedSocialService]);

  const joinGroup = useCallback(async (groupId: string, userId: string) => {
    try {
      setError(null);
      await enhancedSocialService.joinGroup(groupId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
      throw err;
    }
  }, [enhancedSocialService]);

  const getGroupsByType = useCallback((type: SocialGroup['type']) => {
    try {
      setLoadingGroups(true);
      setError(null);
      const groupsByType = enhancedSocialService.getGroupsByType(type);
      setGroups(groupsByType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setLoadingGroups(false);
    }
  }, [enhancedSocialService]);

  // Event methods
  const createEvent = useCallback(async (event: Omit<SocialEvent, 'id' | 'attendees' | 'status'>) => {
    try {
      setError(null);
      const newEvent = await enhancedSocialService.createEvent(event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      throw err;
    }
  }, [enhancedSocialService]);

  const registerForEvent = useCallback(async (eventId: string, userId: string, status: 'registered' | 'attending' | 'declined' | 'maybe' = 'registered') => {
    try {
      setError(null);
      const attendee = await enhancedSocialService.registerForEvent(eventId, userId, status);
      return attendee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register for event');
      throw err;
    }
  }, [enhancedSocialService]);

  const getUpcomingEvents = useCallback(() => {
    try {
      setLoadingEvents(true);
      setError(null);
      const upcomingEvents = enhancedSocialService.getUpcomingEvents();
      setEvents(upcomingEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming events');
    } finally {
      setLoadingEvents(false);
    }
  }, [enhancedSocialService]);

  const getFeaturedEvents = useCallback(() => {
    try {
      setLoadingEvents(true);
      setError(null);
      const featuredEvents = enhancedSocialService.getFeaturedEvents();
      setEvents(featuredEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured events');
    } finally {
      setLoadingEvents(false);
    }
  }, [enhancedSocialService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Reputation
    reputation,
    loadingReputation,
    getReputation,
    addReputationEvent,
    
    // Challenges
    challenges,
    loadingChallenges,
    createChallenge,
    joinChallenge,
    submitChallengeEntry,
    getActiveChallenges,
    getFeaturedChallenges,
    
    // Groups
    groups,
    loadingGroups,
    createGroup,
    joinGroup,
    getGroupsByType,
    
    // Events
    events,
    loadingEvents,
    createEvent,
    registerForEvent,
    getUpcomingEvents,
    getFeaturedEvents,
    
    // Connection
    isConnected,
    error,
    clearError
  };
}; 