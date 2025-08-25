import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@mui/material';
import { type Tournament, TournamentStatus } from '../../types/tournament';
import { format } from 'date-fns';

interface TournamentListProps {
  tournaments: Tournament[];
}

const TournamentList: React.FC<TournamentListProps> = ({ tournaments }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.REGISTRATION:
        return 'primary';
      case TournamentStatus.IN_PROGRESS:
        return 'success';
      case TournamentStatus.COMPLETED:
        return 'default';
      case TournamentStatus.CANCELLED:
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
                <TableCell>{tournament.venue.name}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(tournament.startDate), 'MMM d, yyyy')}
                  </Typography>
                  {tournament.endDate && (
                    <Typography variant="body2" color="text.secondary">
                      to {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {tournament.currentParticipants} /{' '}
                  {tournament.maxParticipants}
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
