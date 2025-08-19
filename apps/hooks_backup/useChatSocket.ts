import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system' | 'join' | 'leave';
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'game' | 'venue' | 'tournament';
  participantCount: number;
}

export const useChatSocket = (
  roomId: string,
  roomType: 'game' | 'venue' | 'tournament' = 'game'
) => {
  const { socket, connected } = useWebSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join chat room when connected
  useEffect(() => {
    if (socket && connected && roomId) {
      socket.emit('join_chat', { room_id: roomId, room_type: roomType });
    }
  }, [socket, connected, roomId, roomType]);

  // Set up chat event listeners
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleChatHistory = (data: {
      messages: ChatMessage[];
      room: ChatRoom;
    }) => {
      setMessages(data.messages);
      setRoom(data.room);
      setLoading(false);
      setError(null);
    };

    const handleRoomUpdate = (data: { room: ChatRoom }) => {
      setRoom(data.room);
    };

    const handleChatError = (data: { message: string }) => {
      setError(data.message);
      setLoading(false);
    };

    // Register event listeners
    socket.on('chat_message', handleChatMessage);
    socket.on('chat_history', handleChatHistory);
    socket.on('room_update', handleRoomUpdate);
    socket.on('chat_error', handleChatError);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('chat_history', handleChatHistory);
      socket.off('room_update', handleRoomUpdate);
      socket.off('chat_error', handleChatError);
    };
  }, [socket]);

  // Chat actions
  const sendMessage = useCallback(
    (message: string) => {
      if (socket && roomId && message.trim()) {
        socket.emit('send_message', {
          room_id: roomId,
          room_type: roomType,
          message: message.trim(),
        });
      }
    },
    [socket, roomId, roomType]
  );

  const leaveChat = useCallback(() => {
    if (socket && roomId) {
      socket.emit('leave_chat', { room_id: roomId, room_type: roomType });
    }
  }, [socket, roomId, roomType]);

  return {
    messages,
    room,
    loading,
    error,
    connected,
    sendMessage,
    leaveChat,
  };
};
