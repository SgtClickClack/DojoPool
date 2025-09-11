import { useChat, useWebSocketConnection } from '@/hooks/useWebSocket';
import {
  People as PeopleIcon,
  Send as SendIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';

interface RealtimeChatProps {
  roomId: string;
  roomName?: string;
  maxHeight?: number;
  showUserList?: boolean;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  roomId,
  roomName = 'Chat Room',
  maxHeight = 400,
  showUserList = false,
}) => {
  const theme = useTheme();
  const { isConnected, connectionState } = useWebSocketConnection();
  const {
    messages,
    isConnected: chatConnected,
    typingUsers,
    sendMessage,
    setTyping,
  } = useChat(roomId, 'Anonymous');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected && chatConnected) {
      sendMessage(newMessage.trim());
      setNewMessage('');

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        setTyping(false);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewMessage(value);

    // Handle typing indicator
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      setTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping(false);
      }, 3000);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      setTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'system':
        return theme.palette.warning.main;
      case 'achievement':
        return theme.palette.success.main;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.cyberpunk.gradients.card,
        border: `1px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.primary.main}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
            {roomName}
          </Typography>
          {showUserList && (
            <Chip
              label="12 online"
              size="small"
              sx={{
                backgroundColor: theme.palette.success.main + '20',
                color: theme.palette.success.main,
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isConnected && chatConnected ? (
            <WifiIcon
              sx={{ color: theme.palette.success.main, fontSize: 18 }}
            />
          ) : (
            <WifiOffIcon
              sx={{ color: theme.palette.error.main, fontSize: 18 }}
            />
          )}
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            {isConnected && chatConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          maxHeight,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.background.paper,
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.primary.main,
            borderRadius: '3px',
          },
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PeopleIcon
              sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{ px: 0, py: 1, alignItems: 'flex-start' }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor:
                        message.type === 'system'
                          ? theme.palette.warning.main
                          : message.type === 'achievement'
                            ? theme.palette.success.main
                            : theme.palette.primary.main,
                    }}
                  >
                    {message.username.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: getMessageColor(message.type),
                          fontWeight:
                            message.type === 'system' ? 'bold' : 'normal',
                        }}
                      >
                        {message.username}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.disabled }}
                      >
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                      {message.type === 'achievement' && (
                        <Chip
                          label="Achievement"
                          size="small"
                          sx={{
                            backgroundColor: theme.palette.success.main,
                            color: theme.palette.success.contrastText,
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.primary,
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {message.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <Box sx={{ mt: 2, px: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}
            >
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`}
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Typing Indicator */}
      {isTyping && (
        <Box
          sx={{ px: 2, py: 1, borderTop: `1px solid ${theme.palette.divider}` }}
        >
          <Typography
            variant="caption"
            sx={{ color: theme.palette.primary.main, fontStyle: 'italic' }}
          >
            You are typing...
          </Typography>
        </Box>
      )}

      {/* Message Input */}
      <Box
        sx={{ p: 2, borderTop: `1px solid ${theme.palette.primary.main}30` }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={
              isConnected && chatConnected
                ? 'Type a message...'
                : 'Connecting...'
            }
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || !chatConnected}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.background.paper,
                '& fieldset': {
                  borderColor: theme.palette.primary.main + '50',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
              },
            }}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected || !chatConnected}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              },
              minWidth: 48,
              px: 2,
            }}
          >
            <SendIcon />
          </Button>
        </Box>

        {!isConnected && (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.warning.main, mt: 1, display: 'block' }}
          >
            ⚠️ Real-time chat unavailable - messages will not be sent
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default RealtimeChat;
