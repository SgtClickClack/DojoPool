import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Typography,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface ActivityCardProps {
  activity: ActivityItem;
  loading?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  loading = false,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'match':
        return '🎯';
      case 'tournament':
        return '🏆';
      case 'clan':
        return '⚔️';
      case 'territory':
        return '🗺️';
      case 'achievement':
        return '⭐';
      case 'coin':
        return '🪙';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'match':
        return 'primary';
      case 'tournament':
        return 'warning';
      case 'clan':
        return 'secondary';
      case 'territory':
        return 'info';
      case 'achievement':
        return 'success';
      case 'coin':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Skeleton
              variant="circular"
              width={24}
              height={24}
              sx={{ mr: 1 }}
            />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
          <Skeleton variant="text" width="80%" height={16} />
        </CardContent>
      </Card>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  });

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ mr: 1 }}>
            {getActivityIcon(activity.type)}
          </Typography>
          <Chip
            label={activity.type}
            size="small"
            color={getActivityColor(activity.type) as any}
            sx={{ mr: 1 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 'auto' }}
          >
            {timeAgo}
          </Typography>
        </Box>
        <Typography variant="body1">{activity.description}</Typography>
        {activity.metadata && (
          <Box sx={{ mt: 1 }}>
            {Object.entries(activity.metadata).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
