import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  People,
  EmojiEvents,
} from '@mui/icons-material';
import { TournamentStatus } from '@/types/tournament';

export interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location: string;
    maxParticipants: number;
    currentParticipants: number;
    entryFee: number;
    prizePool: number;
    status: TournamentStatus;
    participants: Array<{
      id: string;
      username: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  onJoin: (tournamentId: string) => void;
  onView: (tournamentId: string) => void;
  disabled?: boolean;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onJoin, onView, disabled = false }) => {
  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.REGISTRATION:
        return 'info';
      case TournamentStatus.ACTIVE:
        return 'success';
      case TournamentStatus.COMPLETED:
        return 'default';
      case TournamentStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.REGISTRATION:
        return 'Registration Open';
      case TournamentStatus.ACTIVE:
        return 'In Progress';
      case TournamentStatus.COMPLETED:
        return 'Completed';
      case TournamentStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const isFull = tournament.currentParticipants >= tournament.maxParticipants;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {tournament.name}
          </Typography>
          <Chip
            label={getStatusText(tournament.status)}
            color={getStatusColor(tournament.status) as any}
            size="small"
          />
        </Box>

        {tournament.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {tournament.description}
          </Typography>
        )}

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="body2">
              {new Date(tournament.startDate).toLocaleDateString()}
              {tournament.endDate ? ` - ${new Date(tournament.endDate).toLocaleDateString()}` : ''}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2">{tournament.location}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People fontSize="small" color="action" />
            <Typography variant="body2">
              {tournament.currentParticipants}/{tournament.maxParticipants} participants
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents fontSize="small" color="action" />
            <Typography variant="body2">
              Prize Pool: {tournament.prizePool} Dojo Coins
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary">
            Entry: {tournament.entryFee} Dojo Coins
          </Typography>
          {isFull && <Chip label="Full" color="warning" size="small" />}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" onClick={() => onView(tournament.id)} variant="outlined">
          View Details
        </Button>

        {tournament.status === TournamentStatus.REGISTRATION && !isFull && (
          <Button
            size="small"
            onClick={() => onJoin(tournament.id)}
            variant="contained"
            color="primary"
            disabled={disabled}
          >
            Join Tournament
          </Button>
        )}

        {tournament.status === TournamentStatus.REGISTRATION && isFull && (
          <Button size="small" variant="outlined" disabled>
            Tournament Full
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default TournamentCard;
