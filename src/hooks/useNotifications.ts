import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

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

export const useNotifications = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [counts, setCounts] = useState<NotificationCounts>({
    unread_messages: 0,
    pending_requests: 0,
  });
  const toast = useToast();

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/notifications/`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data: NotificationMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'counts_update':
          setCounts(data as NotificationCounts);
          break;

        case 'new_message':
          toast({
            title: 'New Message',
            description: `You have a new message from ${data.message.sender}`,
            status: 'info',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });
          break;

        case 'friend_request':
          toast({
            title: 'Friend Request',
            description: `${data.request.sender} sent you a friend request`,
            status: 'info',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });
          break;

        case 'achievement_unlocked':
          toast({
            title: 'Achievement Unlocked! 🏆',
            description: `${data.achievement.name}: ${data.achievement.description}`,
            status: 'success',
            duration: 7000,
            isClosable: true,
            position: 'top-right',
          });
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [toast]);

  useEffect(() => {
    connect();
  }, [connect]);

  const markMessageRead = useCallback((messageId: number) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        command: 'mark_read',
        message_id: messageId,
      }));
    }
  }, [socket]);

  return {
    counts,
    markMessageRead,
  };
}; 