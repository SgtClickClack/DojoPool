import {
  Add,
  Analytics,
  Close,
  EmojiEvents,
  Highlight,
  PlayArrow,
  SportsEsports,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
// TODO: Implement RealTimeMatchTracker and ChallengeService
// import RealTimeMatchTracker from '../../../../../apps/web/src/components/match/RealTimeMatchTracker';
// import { ChallengeService } from '../../../../../apps/web/src/services/ChallengeService';

// Mock implementations for development
const ChallengeService = {
  getActiveChallenges: async () => {
    return [
      {
        id: 'challenge-1',
        type: 'duel',
        challengerId: 'player-1',
        defenderId: 'player-2',
        dojoId: 'dojo-1',
        status: 'pending',
        createdAt: new Date(),
      },
    ];
  },
  createChallenge: async (challengeData: any) => {
    return {
      id: `challenge-${Date.now()}`,
      ...challengeData,
      status: 'pending',
      createdAt: new Date(),
    };
  },
};

const RealTimeMatchTracker: React.FC<{
  challengeId: string;
  onMatchStart: (match: any) => void;
  onMatchEnd: (result: any) => void;
  onClose: () => void;
}> = ({ challengeId, onMatchStart, onMatchEnd, onClose }) => {
  return (
    <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6">Real-Time Match Tracker</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Challenge ID: {challengeId}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Match tracking component - Coming Soon
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          onClick={() => onMatchStart({ id: challengeId })}
          variant="contained"
          color="success"
        >
          Start Match
        </Button>
        <Button
          onClick={() => onMatchEnd({ id: challengeId, winner: 'player-1' })}
          variant="contained"
          color="warning"
        >
          End Match
        </Button>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </Box>
    </Box>
  );
};

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
      id={`match-tracking-tabpanel-${index}`}
      aria-labelledby={`match-tracking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MatchTrackingPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showMatchTracker, setShowMatchTracker] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    type: 'duel',
    defenderId: '',
    dojoId: '',
  });

  useEffect(() => {
    loadChallenges();
    loadActiveMatches();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const activeChallenges = await ChallengeService.getActiveChallenges();
      setChallenges(activeChallenges);
    } catch (error) {
      setError('Failed to load challenges');
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveMatches = async () => {
    try {
      // In a real implementation, this would fetch from the match tracking API
      const mockActiveMatches = [
        {
          id: 'match-1',
          challengeId: 'challenge-1',
          player1Id: 'player-1',
          player2Id: 'player-2',
          status: 'active',
          score: { player1: 5, player2: 3 },
          startTime: new Date(Date.now() - 300000), // 5 minutes ago
        },
      ];
      setActiveMatches(mockActiveMatches);
    } catch (error) {
      console.error('Error loading active matches:', error);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      setLoading(true);
      const challenge = await ChallengeService.createChallenge(newChallenge);
      setChallenges((prev) => [...prev, challenge]);
      setShowCreateChallenge(false);
      setNewChallenge({ type: 'duel', defenderId: '', dojoId: '' });
    } catch (error) {
      setError('Failed to create challenge');
      console.error('Error creating challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setShowMatchTracker(true);
  };

  const handleMatchStart = (match: any) => {
    console.log('Match started:', match);
    setActiveMatches((prev) => [...prev, match]);
  };

  const handleMatchEnd = (result: any) => {
    console.log('Match ended:', result);
    setMatchHistory((prev) => [...prev, result]);
    setActiveMatches((prev) => prev.filter((m) => m.id !== result.matchId));
    setShowMatchTracker(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getChallengeTypeName = (type: string) => {
    const types = {
      pilgrimage: 'Pilgrimage',
      gauntlet: 'Gauntlet',
      duel: 'Duel',
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusColor = (
    status: string
  ):
    | 'success'
    | 'primary'
    | 'error'
    | 'default'
    | 'warning'
    | 'info'
    | 'secondary' => {
    const colors: Record<
      string,
      | 'success'
      | 'primary'
      | 'error'
      | 'default'
      | 'warning'
      | 'info'
      | 'secondary'
    > = {
      active: 'success',
      accepted: 'primary',
      declined: 'error',
      completed: 'default',
      pending: 'warning',
      in_progress: 'info',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <SportsEsports color="primary" />
        Real-Time Match Tracking
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="match tracking tabs"
        >
          <Tab label="Active Matches" />
          <Tab label="Challenges" />
          <Tab label="Match History" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Active Matches Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h5">
            Active Matches ({activeMatches.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateChallenge(true)}
          >
            Create Challenge
          </Button>
        </Box>

        {activeMatches.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SportsEsports
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Active Matches
              </Typography>
              <Typography color="text.secondary">
                Create a challenge to start tracking a match
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {activeMatches.map((match) => (
              <Grid item xs={12} md={6} key={match.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">Match {match.id}</Typography>
                      <Chip
                        label={match.status}
                        color={getStatusColor(match.status)}
                        size="small"
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2">
                        Player 1: {match.player1Id}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {match.score.player1}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2">
                        Player 2: {match.player2Id}
                      </Typography>
                      <Typography variant="h6" color="secondary">
                        {match.score.player2}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Started: {match.startTime.toLocaleTimeString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Challenges Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h5">Challenges ({challenges.length})</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateChallenge(true)}
          >
            Create Challenge
          </Button>
        </Box>

        {loading ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading challenges...</Typography>
            </CardContent>
          </Card>
        ) : challenges.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Challenges
              </Typography>
              <Typography color="text.secondary">
                Create a challenge to start a match
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {challenges.map((challenge) => (
              <Grid item xs={12} md={6} key={challenge.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">
                        {getChallengeTypeName(challenge.type)} Challenge
                      </Typography>
                      <Chip
                        label={challenge.status}
                        color={getStatusColor(challenge.status)}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Challenger: {challenge.challengerId}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Defender: {challenge.defenderId}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Dojo: {challenge.dojoId}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      {challenge.status === 'accepted' && (
                        <Button
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={() => handleStartMatch(challenge.id)}
                          fullWidth
                        >
                          Start Match
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Match History Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" gutterBottom>
          Match History ({matchHistory.length})
        </Typography>

        {matchHistory.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <EmojiEvents
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Match History
              </Typography>
              <Typography color="text.secondary">
                Completed matches will appear here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <List>
            {matchHistory.map((result, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  <EmojiEvents color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`Match ${result.matchId}`}
                  secondary={
                    <>
                      <Typography variant="body2">
                        Winner: {result.winnerId} ({result.winnerScore} -{' '}
                        {result.loserScore})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Duration: {Math.round(result.matchDuration / 1000)}s
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h5" gutterBottom>
          Match Analytics
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Performance Metrics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analytics will be displayed here as matches are completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Highlight sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Match Highlights
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Highlights will be generated for completed matches
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create Challenge Dialog */}
      <Dialog
        open={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Challenge</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Challenge Type</InputLabel>
              <Select
                value={newChallenge.type}
                onChange={(e) =>
                  setNewChallenge((prev) => ({ ...prev, type: e.target.value }))
                }
                label="Challenge Type"
              >
                <MenuItem value="duel">Duel</MenuItem>
                <MenuItem value="pilgrimage">Pilgrimage</MenuItem>
                <MenuItem value="gauntlet">Gauntlet</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Defender ID"
              value={newChallenge.defenderId}
              onChange={(e) =>
                setNewChallenge((prev) => ({
                  ...prev,
                  defenderId: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              label="Dojo ID"
              value={newChallenge.dojoId}
              onChange={(e) =>
                setNewChallenge((prev) => ({ ...prev, dojoId: e.target.value }))
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateChallenge(false)}>Cancel</Button>
          <Button
            onClick={handleCreateChallenge}
            variant="contained"
            disabled={
              loading || !newChallenge.defenderId || !newChallenge.dojoId
            }
          >
            Create Challenge
          </Button>
        </DialogActions>
      </Dialog>

      {/* Real-Time Match Tracker Dialog */}
      <Dialog
        open={showMatchTracker}
        onClose={() => setShowMatchTracker(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">Real-Time Match Tracker</Typography>
            <IconButton onClick={() => setShowMatchTracker(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <RealTimeMatchTracker
            challengeId={selectedChallengeId}
            onMatchStart={handleMatchStart}
            onMatchEnd={handleMatchEnd}
            onClose={() => setShowMatchTracker(false)}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default MatchTrackingPage;
