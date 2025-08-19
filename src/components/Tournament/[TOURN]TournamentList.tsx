import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TournamentStatus,
  type Tournament,
} from '../../types/[TOURN]tournament';

interface TournamentListProps {
  tournaments: Tournament[];
}

const TournamentList: React.FC<TournamentListProps> = ({ tournaments }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'registration':
        return 'primary';
      case 'in_progress':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Tournaments</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/tournaments/create')}
        >
          Create Tournament
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Players</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tournaments.map((tournament) => (
              <TableRow key={tournament.id}>
                <TableCell>
                  <Typography variant="subtitle1">{tournament.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tournament.format}
                  </Typography>
                </TableCell>
                <TableCell>Venue {tournament.venue_id}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(tournament.start_date), 'MMM d, yyyy')}
                  </Typography>
                  {tournament.end_date && (
                    <Typography variant="body2" color="text.secondary">
                      to {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {/* Player count not available in current interface */}
                  <Typography variant="body2" color="text.secondary">
                    Max: {tournament.max_participants || 'Unlimited'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={tournament.status}
                    color={getStatusColor(tournament.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/tournaments/${tournament.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TournamentList;
