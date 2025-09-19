import { type ActivityEvent, ActivityEventType } from '@/types/activity';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import React from 'react';

interface ActivityEventCardProps {
  event: ActivityEvent;
}

const getEventIcon = (type: ActivityEventType): string => {
  switch (type) {
    case ActivityEventType.GAME_COMPLETED:
      return '⚔️';
    case ActivityEventType.TOURNAMENT_WON:
      return '🏆';
    case ActivityEventType.TERRITORY_CAPTURED:
      return '🏰';
    case ActivityEventType.ACHIEVEMENT_EARNED:
      return '🎯';
    case ActivityEventType.TOURNAMENT_JOINED:
      return '🎮';
    case ActivityEventType.FRIEND_ADDED:
      return '🤝';
    case ActivityEventType.PROFILE_UPDATED:
      return '✏️';
    case ActivityEventType.SHOT_ANALYZED:
      return '📊';
    case ActivityEventType.VENUE_VISITED:
      return '📍';
    case ActivityEventType.CLAN_JOINED:
      return '⚔️';
    case ActivityEventType.CLAN_LEFT:
      return '🚪';
    case ActivityEventType.CHALLENGE_SENT:
      return '📨';
    case ActivityEventType.CHALLENGE_ACCEPTED:
      return '✅';
    case ActivityEventType.CHALLENGE_DECLINED:
      return '❌';
    default:
      return '📢';
  }
};

const getEventColor = (type: ActivityEventType): string => {
  switch (type) {
    case ActivityEventType.TOURNAMENT_WON:
    case ActivityEventType.ACHIEVEMENT_EARNED:
      return '#4caf50'; // Green for achievements
    case ActivityEventType.TERRITORY_CAPTURED:
      return '#ff9800'; // Orange for territory
    case ActivityEventType.GAME_COMPLETED:
      return '#2196f3'; // Blue for games
    case ActivityEventType.CHALLENGE_ACCEPTED:
      return '#4caf50'; // Green for accepted
    case ActivityEventType.CHALLENGE_DECLINED:
      return '#f44336'; // Red for declined
    default:
      return '#757575'; // Gray for others
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const ActivityEventCard: React.FC<ActivityEventCardProps> = ({
  event,
}) => {
  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: `4px solid ${getEventColor(event.type)}`,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Box
            sx={{
              fontSize: '2rem',
              lineHeight: 1,
              mt: 0.5,
            }}
          >
            {getEventIcon(event.type)}
          </Box>

          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Avatar src={event.userAvatar} sx={{ width: 32, height: 32 }}>
                {event.username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle2" color="text.secondary">
                {event.username}
              </Typography>
              <Chip
                label={event.type.replace('_', ' ').toLowerCase()}
                size="small"
                sx={{
                  backgroundColor: getEventColor(event.type),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Box>

            <Typography variant="h6" component="h3" gutterBottom>
              {event.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              {event.description}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(event.createdAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityEventCard;
