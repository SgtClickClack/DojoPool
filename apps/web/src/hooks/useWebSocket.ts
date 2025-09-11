import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  ChatMessage,
  MatchUpdate,
  NotificationData,
  TournamentUpdate,
} from '@/services/websocket/WebSocketService';
import { useCallback, useEffect, useState } from 'react';

export const useTournamentUpdates = (tournamentId?: string) => {
  const { onTournamentUpdate, joinTournament, leaveTournament } =
    useWebSocket();
  const [updates, setUpdates] = useState<TournamentUpdate[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;

    const unsubscribe = onTournamentUpdate((data: TournamentUpdate) => {
      if (data.tournamentId === tournamentId) {
        setUpdates((prev) => [...prev, data]);
      }
    });

    joinTournament(tournamentId);
    setIsSubscribed(true);

    return () => {
      unsubscribe();
      leaveTournament(tournamentId);
      setIsSubscribed(false);
    };
  }, [tournamentId, onTournamentUpdate, joinTournament, leaveTournament]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  return { updates, isSubscribed, clearUpdates };
};

export const useMatchUpdates = (
  matchId?: string,
  spectator: boolean = false
) => {
  const { onMatchUpdate, joinMatch, leaveMatch } = useWebSocket();
  const [updates, setUpdates] = useState<MatchUpdate[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = onMatchUpdate((data: MatchUpdate) => {
      if (data.matchId === matchId) {
        setUpdates((prev) => [...prev, data]);
      }
    });

    joinMatch(matchId, spectator);
    setIsSubscribed(true);

    return () => {
      unsubscribe();
      leaveMatch(matchId);
      setIsSubscribed(false);
    };
  }, [matchId, spectator, onMatchUpdate, joinMatch, leaveMatch]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  return { updates, isSubscribed, clearUpdates };
};

export const useChat = (roomId?: string, username?: string) => {
  const {
    onChatMessage,
    onSystemMessage,
    joinChat,
    leaveChat,
    sendChatMessage,
    sendTypingIndicator,
  } = useWebSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!roomId || !username) return;

    const unsubscribeMessages = onChatMessage((message: ChatMessage) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    const unsubscribeSystem = onSystemMessage((message: any) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            userId: 'system',
            username: 'System',
            message: message.text,
            timestamp: Date.now(),
            roomId,
            type: 'system',
          },
        ]);
      }
    });

    joinChat(roomId, username);
    setIsConnected(true);

    return () => {
      unsubscribeMessages();
      unsubscribeSystem();
      leaveChat(roomId);
      setIsConnected(false);
    };
  }, [roomId, username, onChatMessage, onSystemMessage, joinChat, leaveChat]);

  const sendMessage = useCallback(
    (message: string) => {
      if (roomId && message.trim()) {
        sendChatMessage(roomId, message.trim());
      }
    },
    [roomId, sendChatMessage]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (roomId) {
        sendTypingIndicator(roomId, isTyping);
      }
    },
    [roomId, sendTypingIndicator]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isConnected,
    typingUsers,
    sendMessage,
    setTyping,
    clearMessages,
  };
};

export const useNotifications = () => {
  const { onNotification } = useWebSocket();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const unsubscribe = onNotification((notification: NotificationData) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return unsubscribe;
  }, [onNotification]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
  };
};

export const useBattlePassUpdates = () => {
  const { onBattlePassProgress } = useWebSocket();
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onBattlePassProgress((data: any) => {
      setProgressUpdates((prev) => [...prev, data]);
    });

    return unsubscribe;
  }, [onBattlePassProgress]);

  const clearUpdates = useCallback(() => {
    setProgressUpdates([]);
  }, []);

  return { progressUpdates, clearUpdates };
};

export const useWebSocketConnection = () => {
  const { isConnected, connectionState, socketId, onConnectionChange } =
    useWebSocket();
  const [connectionHistory, setConnectionHistory] = useState<
    Array<{ timestamp: number; connected: boolean; state: string }>
  >([]);

  useEffect(() => {
    const unsubscribe = onConnectionChange((connected: boolean) => {
      setConnectionHistory((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          connected,
          state: connected ? 'connected' : 'disconnected',
        },
      ]);
    });

    // Initial state
    setConnectionHistory([
      {
        timestamp: Date.now(),
        connected: isConnected,
        state: connectionState,
      },
    ]);

    return unsubscribe;
  }, [onConnectionChange, isConnected, connectionState]);

  const getConnectionUptime = () => {
    if (!isConnected || connectionHistory.length === 0) return 0;

    const lastConnected = connectionHistory.filter((h) => h.connected).pop();

    if (!lastConnected) return 0;

    return Date.now() - lastConnected.timestamp;
  };

  const getReconnectionCount = () => {
    return connectionHistory.filter((h) => h.state === 'reconnecting').length;
  };

  return {
    isConnected,
    connectionState,
    socketId,
    connectionHistory,
    getConnectionUptime,
    getReconnectionCount,
  };
};

// Combined hook for tournament participants
export const useTournamentParticipation = (tournamentId?: string) => {
  const tournamentUpdates = useTournamentUpdates(tournamentId);
  const matchUpdates = useMatchUpdates();
  const chat = useChat(`tournament-${tournamentId}`, 'Participant');
  const notifications = useNotifications();

  return {
    tournamentUpdates,
    matchUpdates,
    chat,
    notifications,
    // Combined state
    isActive: tournamentUpdates.isSubscribed && chat.isConnected,
    recentActivity: [
      ...tournamentUpdates.updates.slice(-5),
      ...matchUpdates.updates.slice(-5),
      ...chat.messages.slice(-5),
    ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
  };
};

// Combined hook for spectators
export const useMatchSpectator = (matchId?: string) => {
  const matchUpdates = useMatchUpdates(matchId, true);
  const chat = useChat(`match-${matchId}`, 'Spectator');
  const notifications = useNotifications();

  return {
    matchUpdates,
    chat,
    notifications,
    isSpectating: matchUpdates.isSubscribed,
    spectatorCount:
      matchUpdates.updates.filter((u) => u.event === 'spectator_joined')
        .length -
      matchUpdates.updates.filter((u) => u.event === 'spectator_left').length,
  };
};
