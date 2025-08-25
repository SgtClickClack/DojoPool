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
import { type Tournament } from '../../types/tournament';

interface TournamentListProps {
  tournaments: Tournament[];
}

const TournamentList: React.FC<TournamentListProps> = ({ tournaments }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'REGISTRATION':
        return 'primary';
      case 'IN_PROGRESS':
        return 'success';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
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
                    {format(
                      new Date(
                        (tournament as any).startDate ||
                          (tournament as any).start_date
                      ),
                      'MMM d, yyyy'
                    )}
                  </Typography>
                  {(tournament as any).endDate ||
                  (tournament as any).end_date ? (
                    <Typography variant="body2" color="text.secondary">
                      to{' '}
                      {format(
                        new Date(
                          (tournament as any).endDate ||
                            (tournament as any).end_date
                        ),
                        'MMM d, yyyy'
                      )}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>
                  {((tournament as any).players || []).length} /{' '}
                  {(tournament as any).maxPlayers ||
                    (tournament as any).max_participants}
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
