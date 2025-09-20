import { useAuth } from '@/hooks/useAuth';
import { type ChatMessage, type Conversation } from '@/services/chatService';
import { websocketService, type WebSocketEventData } from '@/services/WebSocketService';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface ChatContextType {
  conversations: Conversation[];
  unreadCount: number;
  updateConversation: (conversation: Conversation) => void;
  addMessage: (message: ChatMessage) => void;
  markConversationAsRead: (conversationId: string) => void;
  refreshConversations: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate total unread count
  useEffect(() => {
    const total = conversations.reduce(
      (sum, conv) => sum + conv.unreadCount,
      0
    );
    setUnreadCount(total);
  }, [conversations]);

  // WebSocket event listener for new messages
  useEffect(() => {
    if (!user) return;

    const unsubscribe = websocketService.subscribe(
      'new_dm',
      ((data: ChatMessage) => {
        // Update conversations with new message
        setConversations((prev) =>
          prev.map((conv) => {
            if (
              conv.participantId === data.senderId ||
              conv.participantId === data.receiverId
            ) {
              return {
                ...conv,
                lastMessage: data,
                unreadCount:
                  conv.participantId === data.senderId
                    ? conv.unreadCount + 1
                    : conv.unreadCount,
                lastActivity: data.timestamp,
              };
            }
            return conv;
          })
        );
      }) as unknown as (data: WebSocketEventData) => void
    );

    return unsubscribe;
  }, [user]);

  const updateConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const existingIndex = prev.findIndex(
        (conv) => conv.id === conversation.id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = conversation;
        return updated;
      } else {
        return [...prev, conversation];
      }
    });
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    // This will be handled by the WebSocket listener
    // But we can also manually add messages if needed
    setConversations((prev) =>
      prev.map((conv) => {
        if (
          conv.participantId === message.senderId ||
          conv.participantId === message.receiverId
        ) {
          return {
            ...conv,
            lastMessage: message,
            lastActivity: message.timestamp,
          };
        }
        return conv;
      })
    );
  }, []);

  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  const refreshConversations = useCallback(() => {
    // This will be called when conversations need to be refreshed
    // The actual implementation will be in the Messages page
  }, []);

  const value: ChatContextType = {
    conversations,
    unreadCount,
    updateConversation,
    addMessage,
    markConversationAsRead,
    refreshConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
