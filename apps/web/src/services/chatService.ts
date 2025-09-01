import { apiClient } from './APIService';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantUsername: string;
  participantAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  lastActivity: string;
}

export interface SendMessageRequest {
  receiverId: string;
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  sentMessage?: ChatMessage;
}

class ChatService {
  async getChatHistory(friendId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`/chat/history/${friendId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return this.getMockChatHistory(friendId);
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get('/chat/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return this.getMockConversations();
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await apiClient.post('/chat/send', request);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send message';
      throw new Error(message);
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await apiClient.post(`/chat/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Mock data for development
  private getMockChatHistory(friendId: string): ChatMessage[] {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: friendId,
        receiverId: 'current_user',
        content: "Hey! How's the pool game going?",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
      },
      {
        id: '2',
        senderId: 'current_user',
        receiverId: friendId,
        content: 'Pretty good! Just won a match at The Jade Tiger.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isRead: true,
      },
      {
        id: '3',
        senderId: friendId,
        receiverId: 'current_user',
        content:
          'Nice! I heard that place is tough to beat. Want to challenge me there sometime?',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        isRead: false,
      },
      {
        id: '4',
        senderId: 'current_user',
        receiverId: friendId,
        content: 'Absolutely! How about tomorrow at 7 PM?',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        isRead: false,
      },
    ];

    return mockMessages;
  }

  private getMockConversations(): Conversation[] {
    return [
      {
        id: 'conv_1',
        participantId: 'friend_1',
        participantUsername: 'PoolMaster',
        participantAvatar: '/avatars/poolmaster.jpg',
        lastMessage: {
          id: '4',
          senderId: 'current_user',
          receiverId: 'friend_1',
          content: 'Absolutely! How about tomorrow at 7 PM?',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          isRead: false,
        },
        unreadCount: 0,
        lastActivity: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: 'conv_2',
        participantId: 'friend_2',
        participantUsername: 'CueArtist',
        participantAvatar: '/avatars/cueartist.jpg',
        lastMessage: {
          id: '5',
          senderId: 'friend_2',
          receiverId: 'current_user',
          content: 'Great game today! Your bank shot was incredible.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          isRead: true,
        },
        unreadCount: 0,
        lastActivity: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'conv_3',
        participantId: 'friend_3',
        participantUsername: 'BreakKing',
        participantAvatar: '/avatars/breakking.jpg',
        lastMessage: {
          id: '6',
          senderId: 'friend_3',
          receiverId: 'current_user',
          content: 'Are you free for a tournament this weekend?',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          isRead: false,
        },
        unreadCount: 1,
        lastActivity: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}

export const chatService = new ChatService();
export default chatService;
