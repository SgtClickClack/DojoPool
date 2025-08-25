import ChatWindow from '@/components/chat/ChatWindow';
import ConversationList from '@/components/chat/ConversationList';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import chatService, { ChatMessage, Conversation } from '@/services/chatService';
import { websocketService } from '@/services/services/network/WebSocketService';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations, updateConversation, markConversationAsRead } =
    useChat();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convs = await chatService.getConversations();
        // Update context with loaded conversations
        convs.forEach((conv) => updateConversation(conv));
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setNotification({
          open: true,
          message: 'Failed to load conversations',
          severity: 'error',
        });
      } finally {
        setIsLoadingConversations(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user, updateConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const chatHistory = await chatService.getChatHistory(
          selectedConversation.participantId
        );
        setMessages(chatHistory);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setNotification({
          open: true,
          message: 'Failed to load chat history',
          severity: 'error',
        });
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  // WebSocket event listener for new messages
  useEffect(() => {
    if (!user) return;

    const unsubscribe = websocketService.subscribe(
      'new_dm',
      (data: ChatMessage) => {
        // Update messages if this is the current conversation
        if (
          selectedConversation &&
          (data.senderId === selectedConversation.participantId ||
            data.receiverId === selectedConversation.participantId)
        ) {
          setMessages((prev) => [...prev, data]);
        }

        // Show notification for new message if not in the conversation
        if (
          !selectedConversation ||
          (data.senderId !== selectedConversation.participantId &&
            data.receiverId !== selectedConversation.participantId)
        ) {
          setNotification({
            open: true,
            message: `New message from ${
              data.senderId === user.id ? 'you' : 'a friend'
            }`,
            severity: 'info',
          });
        }
      }
    );

    return unsubscribe;
  }, [user, selectedConversation]);

  const handleSelectConversation = useCallback(
    (conversation: Conversation) => {
      setSelectedConversation(conversation);

      // Mark messages as read when selecting conversation
      if (conversation.unreadCount > 0) {
        markConversationAsRead(conversation.id);
      }
    },
    [markConversationAsRead]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversation || !user) return;

      try {
        // Send message via WebSocket for real-time delivery
        websocketService.sendDirectMessage(
          selectedConversation.participantId,
          content
        );

        // Create optimistic message
        const optimisticMessage: ChatMessage = {
          id: `temp_${Date.now()}`,
          senderId: user.id,
          receiverId: selectedConversation.participantId,
          content,
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        // Add to messages immediately
        setMessages((prev) => [...prev, optimisticMessage]);

        // Also send via API for persistence
        await chatService.sendMessage({
          receiverId: selectedConversation.participantId,
          content,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        setNotification({
          open: true,
          message: 'Failed to send message',
          severity: 'error',
        });
      }
    },
    [selectedConversation, user]
  );

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Please log in to access messages
        </Typography>
      </Box>
    );
  }

  if (isLoadingConversations) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 120px)' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        💬 Messages
      </Typography>

      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Left Panel - Conversation List */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleSelectConversation}
          />
        </Grid>

        {/* Right Panel - Chat Window */}
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            isLoading={isLoadingMessages}
            onSendMessage={handleSendMessage}
          />
        </Grid>
      </Grid>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
