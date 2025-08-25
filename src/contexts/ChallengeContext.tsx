import React, { createContext, useContext, useEffect, useState } from 'react';
import { ChallengeNotification } from '../components/Notifications/ChallengeNotification';
import { useNotifications } from '../hooks/[NOTIFY]useNotifications';
import { useWebSocket } from '../hooks/useWebSocket';

interface Challenge {
  id: string;
  challengerId: string;
  defenderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  stakeCoins: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface ChallengeContextType {
  challenges: Challenge[];
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (challengeId: string, status: Challenge['status']) => void;
  currentChallenge: Challenge | null;
  setCurrentChallenge: (challenge: Challenge | null) => void;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(
  undefined
);

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};

interface ChallengeProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const ChallengeProvider: React.FC<ChallengeProviderProps> = ({
  children,
  userId,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(
    null
  );
  const { addNotification } = useNotifications();
  const { socket, isConnected } = useWebSocket();

  // Register user with WebSocket for targeted notifications
  useEffect(() => {
    if (isConnected && userId && socket) {
      socket.registerUser(userId);
    }
  }, [isConnected, userId, socket]);

  // Listen for challenge events
  useEffect(() => {
    if (!socket) return;

    const handleNewChallenge = (data: any) => {
      const challenge: Challenge = {
        id: data.challengeId,
        challengerId: data.challengerId,
        defenderId: data.defenderId,
        status: 'PENDING',
        stakeCoins: data.stakeCoins,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        expiresAt:
          data.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Default 1 hour
      };

      addChallenge(challenge);
      setCurrentChallenge(challenge);

      // Show notification
      addNotification({
        type: 'info',
        title: 'New Challenge!',
        message: `You've been challenged to a match!`,
      });
    };

    const handleChallengeResponse = (data: any) => {
      updateChallenge(data.challengeId, data.status);

      const statusText = data.status === 'ACCEPTED' ? 'accepted' : 'declined';
      addNotification({
        type: data.status === 'ACCEPTED' ? 'success' : 'info',
        title: 'Challenge Response',
        message: `Your challenge was ${statusText}!`,
      });
    };

    // Align with WebSocketService event API if it uses addEventListener
    const on = (event: string, handler: any) => {
      if (typeof (socket as any).on === 'function') {
        (socket as any).on(event, handler);
      } else if (typeof (socket as any).addEventListener === 'function') {
        (socket as any).addEventListener(event, handler);
      }
    };
    const off = (event: string, handler: any) => {
      if (typeof (socket as any).off === 'function') {
        (socket as any).off(event, handler);
      } else if (typeof (socket as any).removeEventListener === 'function') {
        (socket as any).removeEventListener(event, handler);
      }
    };

    on('new_challenge', handleNewChallenge);
    on('challenge_response', handleChallengeResponse);

    return () => {
      off('new_challenge', handleNewChallenge);
      off('challenge_response', handleChallengeResponse);
    };
  }, [socket, addNotification]);

  const addChallenge = (challenge: Challenge) =>
    setChallenges((prev) => [...prev, challenge]);

  const updateChallenge = (
    challengeId: string,
    status: Challenge['status']
  ) => {
    setChallenges((prev) =>
      prev.map((challenge) =>
        challenge.id === challengeId
          ? { ...challenge, status, updatedAt: new Date().toISOString() }
          : challenge
      )
    );
  };

  const handleChallengeResponse = (
    challengeId: string,
    status: 'ACCEPTED' | 'DECLINED'
  ) => {
    updateChallenge(challengeId, status);
    setCurrentChallenge(null);
  };

  const value: ChallengeContextType = {
    challenges,
    addChallenge,
    updateChallenge,
    currentChallenge,
    setCurrentChallenge,
  };

  return (
    <ChallengeContext.Provider value={value}>
      {children}
      {currentChallenge && (
        <ChallengeNotification
          open={!!currentChallenge}
          challenge={{
            challengeId: currentChallenge.id,
            challengerId: currentChallenge.challengerId,
            stakeCoins: currentChallenge.stakeCoins,
            expiresAt: currentChallenge.expiresAt,
          }}
          onClose={() => setCurrentChallenge(null)}
          onResponse={handleChallengeResponse}
        />
      )}
    </ChallengeContext.Provider>
  );
};
