import { useAuth } from '@/hooks/useAuth';
import { type ChatMessage, type Conversation } from '@/services/chatService';
import { Send as SendIcon } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  isLoading,
  onSendMessage,
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ChatMessage): boolean => {
    return message.senderId === user?.id;
  };

  if (!conversation) {
    return (
      <Paper
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a conversation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a friend from the list to start chatting
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={conversation.participantAvatar}
            alt={conversation.participantUsername}
            sx={{ width: 40, height: 40 }}
          >
            {conversation.participantUsername.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" component="h3">
              {conversation.participantUsername}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {conversation.unreadCount > 0
                ? `${conversation.unreadCount} unread message${
                    conversation.unreadCount !== 1 ? 's' : ''
                  }`
                : 'All caught up'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No messages yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Start the conversation!
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: isOwnMessage(message)
                          ? 'flex-end'
                          : 'flex-start',
                        p: 0,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          maxWidth: '70%',
                          alignItems: isOwnMessage(message)
                            ? 'flex-end'
                            : 'flex-start',
                        }}
                      >
                        <Box
                          sx={{
                            backgroundColor: isOwnMessage(message)
                              ? 'primary.main'
                              : 'grey.100',
                            color: isOwnMessage(message)
                              ? 'white'
                              : 'text.primary',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            wordBreak: 'break-word',
                            maxWidth: '100%',
                          }}
                        >
                          <Typography variant="body2">
                            {message.content}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, fontSize: '0.75rem' }}
                        >
                          {formatMessageTime(message.timestamp)}
                          {!message.isRead && isOwnMessage(message) && (
                            <span style={{ marginLeft: '8px' }}>•</span>
                          )}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < messages.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))
              )}
              <div ref={messagesEndRef} />
            </List>
          </>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {isSending ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
