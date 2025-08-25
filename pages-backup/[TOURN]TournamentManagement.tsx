import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  IconButton,
  Divider,
  Avatar,
  Stack,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import {
  Add as AddIcon,
  EmojiEvents,
  People,
  Schedule,
  LocationOn,
  AttachMoney,
  PlayArrow,
  Pause,
  Stop,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import TournamentBracket from '../src/components/Tournament/TournamentBracket';
import {
  Tournament,
  TournamentMatch,
  TournamentStatus,
  TournamentFormat,
} from '../src/types/tournament';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tournament-tabpanel-${index}`}
      aria-labelledby={`tournament-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const TournamentManagement: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    venue_id: '',
    start_date: new Date(),
    end_date: new Date(),
    registration_deadline: new Date(),
    max_participants: 8,
    entry_fee: 0,
    total_prize_pool: 0,
    rules: '',
    format: TournamentFormat.SINGLE_ELIMINATION,
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tournaments/active');
      setTournaments(response.data.tournaments);
      if (response.data.tournaments.length > 0) {
        setSelectedTournament(response.data.tournaments[0]);
      }
    } catch (err) {
      setError('Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    try {
      const response = await api.post('/tournaments', newTournament);
      setTournaments([...tournaments, response.data]);
      setCreateDialogOpen(false);
      setNewTournament({
        name: '',
        description: '',
        venue_id: '',
        start_date: new Date(),
        end_date: new Date(),
        registration_deadline: new Date(),
        max_participants: 8,
        entry_fee: 0,
        total_prize_pool: 0,
        rules: '',
        format: TournamentFormat.SINGLE_ELIMINATION,
      });
    } catch (err) {
      setError('Failed to create tournament');
    }
  };

  const handleRegisterForTournament = async (tournamentId: number) => {
    try {
      await api.post(`/tournaments/${tournamentId}/register`);
      // Refresh tournament data
      const response = await api.get(`/tournaments/${tournamentId}`);
      const updatedTournament = response.data;
      setTournaments(
        tournaments.map((t) =>
          t.id === updatedTournament.id ? updatedTournament : t
        )
      );
      setSelectedTournament(updatedTournament);
    } catch (err) {
      setError('Failed to register for tournament');
    }
  };

  const handleMatchClick = async (match: TournamentMatch) => {
    if (
      match.status === 'in_progress' &&
      user?.id === selectedTournament?.organizerId
    ) {
      // Show match result dialog for tournament organizer
      // Implementation for match result update dialog
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN:
        return '#00ff00';
      case TournamentStatus.ACTIVE:
        return '#ff00ff';
      case TournamentStatus.COMPLETED:
        return '#00ffff';
      case TournamentStatus.CANCELLED:
        return '#ff0000';
      default:
        return '#888888';
    }
  };

  const getFormatColor = (format: TournamentFormat) => {
    switch (format) {
      case TournamentFormat.SINGLE_ELIMINATION:
        return '#ff8800';
      case TournamentFormat.DOUBLE_ELIMINATION:
        return '#8800ff';
      case TournamentFormat.ROUND_ROBIN:
        return '#0088ff';
      default:
        return '#888888';
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        sx={{
          background:
            'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          color: '#00ffff',
        }}
      >
        <CircularProgress
          sx={{
            color: '#00ffff',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#ffffff',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                }}
              >
                Tournament Management
              </Typography>
            </Grid>
            <Grid item>
              {user?.id && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
                    color: '#000',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                      boxShadow: '0 0 30px rgba(0, 255, 255, 0.7)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Create Tournament
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid #ff0000',
              color: '#ff6666',
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Paper
          sx={{
            background: 'rgba(26, 26, 46, 0.8)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.1)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#888888',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1.1rem',
                '&.Mui-selected': {
                  color: '#00ffff',
                  textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00ffff',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              },
            }}
          >
            <Tab label="Active Tournaments" />
            <Tab label="My Tournaments" />
            <Tab label="Past Tournaments" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {tournaments.map((tournament) => (
                <Grid item xs={12} key={tournament.id}>
                  <Card
                    sx={{
                      background: 'rgba(22, 33, 62, 0.6)',
                      border: '1px solid rgba(0, 255, 255, 0.2)',
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        border: '1px solid rgba(0, 255, 255, 0.5)',
                        boxShadow: '0 8px 32px rgba(0, 255, 255, 0.2)',
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            sx={{ mb: 2 }}
                          >
                            <Typography
                              variant="h5"
                              sx={{
                                color: '#00ffff',
                                fontWeight: 'bold',
                                textShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                              }}
                            >
                              {tournament.name}
                            </Typography>
                            <Chip
                              label={tournament.status}
                              sx={{
                                backgroundColor: `rgba(${getStatusColor(tournament.status)}, 0.2)`,
                                color: getStatusColor(tournament.status),
                                border: `1px solid ${getStatusColor(tournament.status)}`,
                                fontWeight: 'bold',
                                textShadow: '0 0 5px currentColor',
                              }}
                            />
                            <Chip
                              label={tournament.format}
                              sx={{
                                backgroundColor: `rgba(${getFormatColor(tournament.format)}, 0.2)`,
                                color: getFormatColor(tournament.format),
                                border: `1px solid ${getFormatColor(tournament.format)}`,
                                fontWeight: 'bold',
                                textShadow: '0 0 5px currentColor',
                              }}
                            />
                          </Stack>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mb: 1 }}
                              >
                                <Schedule
                                  sx={{ color: '#ff00ff', fontSize: 20 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#cccccc' }}
                                >
                                  Start:{' '}
                                  {new Date(
                                    tournament.startDate
                                  ).toLocaleString()}
                                </Typography>
                              </Stack>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mb: 1 }}
                              >
                                <People
                                  sx={{ color: '#00ff00', fontSize: 20 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#cccccc' }}
                                >
                                  {tournament.participants}/
                                  {tournament.maxParticipants} Participants
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mb: 1 }}
                              >
                                <AttachMoney
                                  sx={{ color: '#ffff00', fontSize: 20 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#cccccc' }}
                                >
                                  Entry Fee: ${tournament.entryFee || 0}
                                </Typography>
                              </Stack>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mb: 1 }}
                              >
                                <EmojiEvents
                                  sx={{ color: '#ff8800', fontSize: 20 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#cccccc' }}
                                >
                                  Prize Pool: ${tournament.prizePool || 0}
                                </Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid item>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              startIcon={<Visibility />}
                              onClick={() => setSelectedTournament(tournament)}
                              sx={{
                                background:
                                  'linear-gradient(45deg, #00ffff, #0088ff)',
                                color: '#000',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                borderRadius: 2,
                                boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                                '&:hover': {
                                  background:
                                    'linear-gradient(45deg, #0088ff, #00ffff)',
                                  boxShadow: '0 0 25px rgba(0, 255, 255, 0.6)',
                                  transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              View
                            </Button>
                            {tournament.status === TournamentStatus.OPEN && (
                              <Button
                                variant="contained"
                                startIcon={<PlayArrow />}
                                onClick={() =>
                                  handleRegisterForTournament(
                                    Number(tournament.id)
                                  )
                                }
                                sx={{
                                  background:
                                    'linear-gradient(45deg, #00ff00, #008800)',
                                  color: '#000',
                                  fontWeight: 'bold',
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)',
                                  '&:hover': {
                                    background:
                                      'linear-gradient(45deg, #008800, #00ff00)',
                                    boxShadow: '0 0 25px rgba(0, 255, 0, 0.6)',
                                    transform: 'translateY(-2px)',
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                Register
                              </Button>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {selectedTournament && (
              <TournamentBracket
                tournament={selectedTournament}
                onMatchClick={handleMatchClick}
              />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography
              variant="h6"
              sx={{ color: '#888888', textAlign: 'center', py: 4 }}
            >
              Past tournaments will be displayed here
            </Typography>
          </TabPanel>
        </Paper>

        {/* Create Tournament Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(26, 26, 46, 0.95)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: 3,
              backdropFilter: 'blur(20px)',
              color: '#ffffff',
            },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Create New Tournament
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tournament Name"
                  value={newTournament.name}
                  onChange={(e) =>
                    setNewTournament({ ...newTournament, name: e.target.value })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00ffff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#888888',
                      '&.Mui-focused': {
                        color: '#00ffff',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newTournament.description}
                  onChange={(e) =>
                    setNewTournament({
                      ...newTournament,
                      description: e.target.value,
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00ffff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#888888',
                      '&.Mui-focused': {
                        color: '#00ffff',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Participants"
                  value={newTournament.max_participants}
                  onChange={(e) =>
                    setNewTournament({
                      ...newTournament,
                      max_participants: parseInt(e.target.value),
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00ffff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#888888',
                      '&.Mui-focused': {
                        color: '#00ffff',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Entry Fee"
                  value={newTournament.entry_fee}
                  onChange={(e) =>
                    setNewTournament({
                      ...newTournament,
                      entry_fee: parseFloat(e.target.value),
                    })
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 255, 255, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00ffff',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#888888',
                      '&.Mui-focused': {
                        color: '#00ffff',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setCreateDialogOpen(false)}
              sx={{
                color: '#888888',
                '&:hover': {
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTournament}
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #00ff00, #008800)',
                color: '#000',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #008800, #00ff00)',
                  boxShadow: '0 0 25px rgba(0, 255, 0, 0.6)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Create Tournament
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TournamentManagement;
