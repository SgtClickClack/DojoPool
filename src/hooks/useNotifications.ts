import { useState, useEffect, useCallback } from "react";
import { SocketIOService } from "../services/network/WebSocketService";

interface NotificationCounts {
  unread_messages: number;
  pending_requests: number;
}

interface NotificationMessage {
  type: string;
  message?: any;
  request?: any;
  achievement?: any;
}

interface ChallengeData {
  id: string;
  challenger: { id: string; name: string };
  defender: { id: string; name: string };
  dojo: { id: string; name: string };
  type: string;
  status: string;
}

export const useNotifications = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [counts, setCounts] = useState<NotificationCounts>({
    unread_messages: 0,
    pending_requests: 0,
  });

  // Simple notification function that doesn't rely on Chakra UI
  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    // Use browser's native notification API if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DojoPool', {
        body: message,
        icon: '/favicon.ico',
      });
    }

    // Also log to console for development
    console.log(`[${type.toUpperCase()}] ${message}`);

    // You can add a custom toast implementation here if needed
    // For now, we'll use console logging and browser notifications
  }, []);

  useEffect(() => {
    const wsService = SocketIOService.getInstance();

    if (wsService && wsService.socket) {
      setSocket(wsService.socket);

      // Register user with backend
      const currentPlayerId = localStorage.getItem('playerId') || 'anonymous';
      wsService.socket.emit('register_user', { userId: currentPlayerId });

      // Listen for challenge events
      const handleNewChallenge = (challenge: ChallengeData) => {
        addNotification(`You have been challenged by ${challenge.challenger.name} at ${challenge.dojo.name}!`, 'info');
      };

      const handleChallengeResponse = (challenge: ChallengeData) => {
        const action = challenge.status === 'accepted' ? 'accepted' : 'declined';
        addNotification(`${challenge.defender.name} has ${action} your challenge.`, 'info');
      };

      wsService.socket.on('new_challenge', handleNewChallenge);
      wsService.socket.on('challenge_response', handleChallengeResponse);

      // Listen for other notification events
      wsService.socket.on('notification', (data: NotificationMessage) => {
        switch (data.type) {
          case "counts_update":
            setCounts(data as unknown as NotificationCounts);
            break;
          case "message":
            addNotification(data.message?.content || 'New message received', 'info');
            break;
          case "request":
            addNotification(`New request from ${data.request?.from}`, 'info');
            break;
          case "achievement":
            addNotification(`Achievement unlocked: ${data.achievement?.name}`, 'success');
            break;
          default:
            addNotification('New notification received', 'info');
        }
      });

      return () => {
        wsService.socket.off('new_challenge', handleNewChallenge);
        wsService.socket.off('challenge_response', handleChallengeResponse);
        wsService.socket.off('notification');
      };
    }
  }, [addNotification]);

  return {
    counts,
    addNotification,
    socket,
  };
};
