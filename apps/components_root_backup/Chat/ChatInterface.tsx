import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Block,
  Report,
} from '@mui/icons-material';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useAuth } from '../../hooks/useAuth';

interface ChatInterfaceProps {
  roomId: string;
  roomType: 'game' | 'venue' | 'tournament';
  roomName?: string;
  maxHeight?: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  roomId,
  roomType,
  roomName,
  maxHeight = 400,
}) => {
  const { user } = useAuth();
  const { messages, room, loading, error, connected, sendMessage, leaveChat } =
    useChatSocket(roomId, roomType);

  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveChat();
    };
  }, [leaveChat]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'info';
      case 'join':
        return 'success';
      case 'leave':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return '🔔';
      case 'join':
        return '👋';
      case 'leave':
        return '👋';
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, height: maxHeight }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Connecting to chat...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, height: maxHeight }}>
        <Alert severity="error">
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: maxHeight, display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Typography variant="h6">
              {roomName || room?.name || `${roomType} Chat`}
            </Typography>
            <Chip
              label={connected ? 'Connected' : 'Disconnected'}
              color={connected ? 'success' : 'error'}
              size="small"
              sx={{ ml: 1 }}
            />
            {room && (
              <Chip
                label={`${room.participantCount} online`}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <List dense>
          {messages.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    No messages yet. Start the conversation!
                  </Typography>
                }
              />
            </ListItem>
          ) : (
            messages.map((message) => (
              <ListItem key={message.id} sx={{ py: 0.5 }}>
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <Avatar
                      sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}
                    >
                      {message.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {message.username}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {formatTimestamp(message.timestamp)}
                    </Typography>
                    {message.type !== 'message' && (
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {getMessageTypeIcon(message.type)}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ ml: 3 }}>
                    {message.type === 'message' ? (
                      <Typography variant="body2">{message.message}</Typography>
                    ) : (
                      <Chip
                        label={message.message}
                        color={getMessageTypeColor(message.type) as any}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </ListItem>
            ))
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      <Divider />

      {/* Message Input */}
      <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="flex-end" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!connected}
            size="small"
          />
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Tooltip title="Emoji">
              <IconButton
                size="small"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <EmojiEmotions />
              </IconButton>
            </Tooltip>
            <Tooltip title="Attach File">
              <IconButton size="small" disabled>
                <AttachFile />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Message">
              <IconButton
                size="small"
                color="primary"
                onClick={handleSendMessage}
                disabled={!connected || !newMessage.trim()}
              >
                <Send />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatInterface;
