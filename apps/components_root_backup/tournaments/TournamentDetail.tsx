import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  generateBracket,
  getTournament,
  getTournamentMatches,
  registerForTournament,
  updateMatch,
} from '../../api/tournaments';
import { useAuth } from '../../hooks/useAuth';
import {
  type Tournament,
  type TournamentMatch,
} from '../../types/[TOURN]tournament';
// import MatchStats from './MatchStats';

interface ParamsType {
  id: string;
  [key: string]: string;
}

const TournamentDetail: React.FC = () => {
  const { id } = useParams<ParamsType>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament>();
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = false; // TODO: Add admin check when implemented

  useEffect(() => {
    if (id) {
      fetchTournament();
      fetchMatches();
    }
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const data = await getTournament(id);
      setTournament(data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      console.error('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const data = await getTournamentMatches(id);
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      console.error('Failed to load tournament matches');
    }
  };

  const handleRegister = async () => {
    try {
      await registerForTournament(id);
      console.log('Successfully registered for tournament');
      fetchTournament();
    } catch (error) {
      console.error('Error registering for tournament:', error);
      console.error('Failed to register for tournament');
    }
  };

  const handleGenerateBracket = async () => {
    try {
      await generateBracket(id);
      console.log('Tournament bracket generated successfully');
      fetchTournament();
      fetchMatches();
    } catch (error) {
      console.error('Error generating bracket:', error);
      console.error('Failed to generate tournament bracket');
    }
  };

  const handleUpdateMatch = async (values: any) => {
    if (!selectedMatch) return;

    try {
      await updateMatch(selectedMatch.id, values);
      console.log('Match updated successfully');
      setIsModalVisible(false);
      fetchMatches();
    } catch (error) {
      console.error('Error updating match:', error);
      console.error('Failed to update match');
    }
  };

  // Temporarily commented out due to build issues
  /*
  const matchColumns = [
    {
      title: 'Round',
      dataIndex: 'round_number',
      key: 'round_number',
    },
    {
      title: 'Match',
      dataIndex: 'match_number',
      key: 'match_number',
    },
    {
      title: 'Player 1',
      dataIndex: 'player1',
      key: 'player1',
      render: (player: TournamentParticipant) =>
        player ? player.name : 'TBD',
    },
    {
      title: 'Player 2',
      dataIndex: 'player2',
      key: 'player2',
      render: (player: TournamentParticipant) =>
        player ? player.name : 'TBD',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === 'completed'
              ? 'success'
              : status === 'processing'
                ? 'processing'
                : status === 'walkover'
                  ? 'warning'
                  : status === 'cancelled'
                    ? 'error'
                    : 'default'
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: TournamentMatch) => (
        <Space>
          {isAdmin && record.status !== 'completed' && (
            <Button
              type="primary"
              onClick={() => {
                setSelectedMatch(record);
                setIsModalVisible(true);
              }}
            >
              Update
            </Button>
          )}
        </Space>
      ),
    },
  ];
  */

  if (!tournament) {
    return <div>Loading...</div>;
  }

  const totalRounds = tournament.bracket_data?.rounds || 0;

  return (
    <div className="tournament-detail">
      <Card>
        <CardContent>
          <Box className="tournament-detail__header" sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {tournament.name}
                </Typography>
                <Chip
                  label={tournament.status.toUpperCase()}
                  color={
                    tournament.status === 'completed'
                      ? 'success'
                      : tournament.status === 'in_progress'
                      ? 'primary'
                      : tournament.status === 'registration'
                      ? 'warning'
                      : tournament.status === 'cancelled'
                      ? 'error'
                      : 'default'
                  }
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                  {isAuthenticated && tournament.status === 'registration' && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleRegister}
                    >
                      Register
                    </Button>
                  )}
                  {isAdmin && tournament.status === 'registration' && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleGenerateBracket}
                    >
                      Generate Bracket
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Format
              </Typography>
              <Typography variant="body1">{tournament.format}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Start Date
              </Typography>
              <Typography variant="body1">
                {moment(tournament.start_date).format('MMM D, YYYY')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Entry Fee
              </Typography>
              <Typography variant="body1">
                ${tournament.entry_fee.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Prize Pool
              </Typography>
              <Typography variant="body1">
                ${tournament.prize_pool.toFixed(2)}
              </Typography>
            </Grid>
            {tournament.registration_deadline && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Registration Deadline
                </Typography>
                <Typography variant="body1">
                  {moment(tournament.registration_deadline).format(
                    'MMM D, YYYY'
                  )}
                </Typography>
              </Grid>
            )}
            {tournament.max_participants && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Max Participants
                </Typography>
                <Typography variant="body1">
                  {tournament.max_participants}
                </Typography>
              </Grid>
            )}
          </Grid>

          {tournament.rules && (
            <Box className="tournament-detail__rules" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Rules
              </Typography>
              <Typography variant="body1">{tournament.rules}</Typography>
            </Box>
          )}

          <Box sx={{ width: '100%' }}>
            <Tabs value={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Matches" />
              <Tab label="Bracket" />
              <Tab label="Statistics" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {/* Matches Tab */}
              <Box role="tabpanel" hidden={false}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Round</TableCell>
                        <TableCell>Match</TableCell>
                        <TableCell>Player 1</TableCell>
                        <TableCell>Player 2</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {matches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell>{match.round_number}</TableCell>
                          <TableCell>{match.match_number}</TableCell>
                          <TableCell>
                            {match.player1?.username || 'TBD'}
                          </TableCell>
                          <TableCell>
                            {match.player2?.username || 'TBD'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={match.status.toUpperCase()}
                              color={
                                match.status === 'completed'
                                  ? 'success'
                                  : match.status === 'in_progress'
                                  ? 'primary'
                                  : 'default'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {isAdmin && match.status !== 'completed' && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setIsModalVisible(true);
                                }}
                              >
                                Update
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Bracket Tab */}
              <Box role="tabpanel" hidden={false}>
                {matches.length > 0 ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Tournament Bracket
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {matches.length} matches available
                    </Typography>
                    {/* Simple bracket display - can be enhanced later */}
                    <Box sx={{ mt: 2 }}>
                      {matches.map((match) => (
                        <Paper key={match.id} sx={{ p: 2, mb: 1 }}>
                          <Typography variant="body2">
                            Round {match.round_number} - Match{' '}
                            {match.match_number}
                          </Typography>
                          <Typography variant="body1">
                            {match.player1?.username || 'TBD'} vs{' '}
                            {match.player2?.username || 'TBD'}
                          </Typography>
                          <Chip
                            label={match.status.toUpperCase()}
                            color={
                              match.status === 'completed'
                                ? 'success'
                                : match.status === 'in_progress'
                                ? 'primary'
                                : 'default'
                            }
                            variant="outlined"
                            size="small"
                          />
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography>No bracket data available</Typography>
                )}
              </Box>

              {/* Statistics Tab */}
              <Box role="tabpanel" hidden={false}>
                <Typography variant="h6" gutterBottom>
                  Tournament Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="primary">
                          {matches.length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Matches
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="primary">
                          {tournament.max_participants || 'Unlimited'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Max Participants
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Match</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleUpdateMatch} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Winner</InputLabel>
              <MuiSelect
                value={selectedMatch?.winner_id || ''}
                onChange={(e) => {
                  // Handle winner selection
                }}
                label="Winner"
              >
                {selectedMatch?.player1 && (
                  <MenuItem value={selectedMatch.player1.id}>
                    {selectedMatch.player1.username}
                  </MenuItem>
                )}
                {selectedMatch?.player2 && (
                  <MenuItem value={selectedMatch.player2.id}>
                    {selectedMatch.player2.username}
                  </MenuItem>
                )}
              </MuiSelect>
            </FormControl>

            <TextField
              fullWidth
              label="Score"
              placeholder="e.g., 2-1"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Table Number"
              type="number"
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => setIsModalVisible(false)}
              >
                Cancel
              </Button>
              <Button variant="contained" type="submit">
                Update
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentDetail;
