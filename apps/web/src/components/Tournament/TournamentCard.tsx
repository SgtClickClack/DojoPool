import {
  CalendarToday,
  EmojiEvents,
  LocationOn,
  People,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';

interface TournamentCardProps {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  onJoin?: (tournamentId: string) => void;
  onView?: (tournamentId: string) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  id,
  name,
  description,
  startDate,
  endDate,
  location,
  maxParticipants,
  currentParticipants,
  entryFee,
  prizePool,
  status,
  onJoin,
  onView,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'upcoming':
        return 'info';
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const isFull = currentParticipants >= maxParticipants;
  const canJoin = status === 'upcoming' && !isFull;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            {name}
          </Typography>
          <Chip
            label={getStatusText()}
            color={getStatusColor() as any}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="body2">
              {new Date(startDate).toLocaleDateString()} -{' '}
              {new Date(endDate).toLocaleDateString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2">{location}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People fontSize="small" color="action" />
            <Typography variant="body2">
              {currentParticipants}/{maxParticipants} participants
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents fontSize="small" color="action" />
            <Typography variant="body2">
              Prize Pool: {prizePool} Dojo Coins
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" color="primary">
            Entry: {entryFee} Dojo Coins
          </Typography>
          {isFull && <Chip label="Full" color="warning" size="small" />}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" onClick={() => onView?.(id)} variant="outlined">
          View Details
        </Button>

        {canJoin && (
          <Button
            size="small"
            onClick={() => onJoin?.(id)}
            variant="contained"
            color="primary"
          >
            Join Tournament
          </Button>
        )}

        {!canJoin && status === 'upcoming' && isFull && (
          <Button size="small" variant="outlined" disabled>
            Tournament Full
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default TournamentCard;
