import { Conversation } from '@/services/chatService';
import {
  Avatar,
  Badge,
  Box,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
}) => {
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (content: string, maxLength: number = 50): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Paper sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" component="h2">
          Messages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {conversations.length} conversation
          {conversations.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <List sx={{ p: 0, height: 'calc(100% - 80px)', overflow: 'auto' }}>
        {conversations.map((conversation, index) => (
          <React.Fragment key={conversation.id}>
            <ListItem
              button
              selected={selectedConversationId === conversation.id}
              onClick={() => onSelectConversation(conversation)}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={conversation.unreadCount}
                  color="error"
                  invisible={conversation.unreadCount === 0}
                >
                  <Avatar
                    src={conversation.participantAvatar}
                    alt={conversation.participantUsername}
                    sx={{ width: 48, height: 48 }}
                  >
                    {conversation.participantUsername.charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      component="span"
                      sx={{
                        fontWeight:
                          conversation.unreadCount > 0 ? 'bold' : 'normal',
                        color:
                          conversation.unreadCount > 0
                            ? 'text.primary'
                            : 'text.primary',
                      }}
                    >
                      {conversation.participantUsername}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {conversation.lastMessage
                        ? formatTimestamp(conversation.lastMessage.timestamp)
                        : ''}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={
                        conversation.unreadCount > 0
                          ? 'text.primary'
                          : 'text.secondary'
                      }
                      sx={{
                        fontWeight:
                          conversation.unreadCount > 0 ? 'bold' : 'normal',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conversation.lastMessage
                        ? truncateMessage(conversation.lastMessage.content)
                        : 'No messages yet'}
                    </Typography>
                    {conversation.unreadCount > 0 && (
                      <Box
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {conversation.unreadCount > 9
                          ? '9+'
                          : conversation.unreadCount}
                      </Box>
                    )}
                  </Box>
                }
                sx={{ mr: 1 }}
              />
            </ListItem>
            {index < conversations.length - 1 && <Divider />}
          </React.Fragment>
        ))}

        {conversations.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Start chatting with your friends!
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
};

export default ConversationList;
