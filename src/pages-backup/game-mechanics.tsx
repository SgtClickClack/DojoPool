import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  EmojiEvents,
  LocationOn,
  Person,
  TrendingUp,
  SportsEsports,
  Close,
  Add,
  Info,
} from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import PageBackground from '../components/common/PageBackground';
import ChallengeCreationPanel from '../components/game/ChallengeCreationPanel';
import TerritoryControlPanel from '../components/game/TerritoryControlPanel';
import PlayerMovementPanel from '../components/game/PlayerMovementPanel';
import AchievementPanel from '../components/game/AchievementPanel';
import RealTimeMatchTracker from '../components/game/RealTimeMatchTracker';
import GameMechanicsService from '../services/GameMechanicsService';

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
      id={`game-mechanics-tabpanel-${index}`}
      aria-labelledby={`game-mechanics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const GameMechanicsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [gameMechanicsService] = useState(new GameMechanicsService());
  const [gameState, setGameState] = useState<any>(null);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [showTerritoryDialog, setShowTerritoryDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [showMatchTracker, setShowMatchTracker] = useState(false);
  const [selectedDojo, setSelectedDojo] = useState<any>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Initialize game state
    const initialState = gameMechanicsService.getGameState();
    setGameState(initialState);

    // Listen for game events
    gameMechanicsService.on('challengeCreated', (challenge) => {
      addNotification(
        `Challenge created: ${challenge.type} against ${challenge.defenderId}`
      );
    });

    gameMechanicsService.on('territoryClaimed', (territory) => {
      addNotification(`Territory claimed: ${territory.dojoName}`);
    });

    gameMechanicsService.on('travelStarted', (movement) => {
      addNotification(`Travel started to ${movement.toLocation.dojoName}`);
    });

    gameMechanicsService.on('achievementUnlocked', (achievement) => {
      addNotification(`Achievement unlocked: ${achievement.title}`);
    });

    gameMechanicsService.on('matchStarted', (match) => {
      addNotification(
        `Match started: ${match.player1Id} vs ${match.player2Id}`
      );
    });

    return () => {
      gameMechanicsService.disconnect();
    };
  }, [gameMechanicsService]);

  const addNotification = (message: string) => {
    setNotifications((prev) => [...prev, message]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n !== message));
    }, 5000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDojoSelect = (dojo: any) => {
    setSelectedDojo(dojo);
  };

  // Mock dojo data
  const mockDojos = [
    {
      id: 'dojo-1',
      name: 'The Empire Hotel',
      status: 'available',
      controller: null,
      distance: 0.2,
    },
    {
      id: 'dojo-2',
      name: 'The Wickham',
      status: 'controlled',
      controller: 'Shadow Clan',
      distance: 0.8,
    },
    {
      id: 'dojo-3',
      name: 'The Victory Hotel',
      status: 'locked',
      controller: null,
      distance: 1.2,
    },
  ];

  return (
    <Layout>
      <PageBackground>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ textAlign: 'center', mb: 4 }}
          >
            Game Mechanics Hub
          </Typography>

          {/* Notifications */}
          {notifications.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {notifications.map((notification, index) => (
                <Alert
                  key={index}
                  severity="info"
                  sx={{ mb: 1 }}
                  onClose={() =>
                    setNotifications((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  {notification}
                </Alert>
              ))}
            </Box>
          )}

          {/* Game State Overview */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Current Game State
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {gameState?.matchState?.isInMatch
                        ? 'In Match'
                        : 'Available'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Match Status
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {gameState?.activeChallenges?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Challenges
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success">
                      {gameState?.territoryControl?.controlledDojos?.length ||
                        0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Controlled Territories
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning">
                      {gameState?.isTraveling ? 'Traveling' : 'Stationary'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Movement Status
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="game mechanics tabs"
              >
                <Tab
                  icon={<EmojiEvents />}
                  label="Challenges"
                  iconPosition="start"
                />
                <Tab
                  icon={<LocationOn />}
                  label="Territory Control"
                  iconPosition="start"
                />
                <Tab
                  icon={<Person />}
                  label="Player Movement"
                  iconPosition="start"
                />
                <Tab
                  icon={<TrendingUp />}
                  label="Achievements"
                  iconPosition="start"
                />
                <Tab
                  icon={<SportsEsports />}
                  label="Match Tracking"
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6">Challenge System</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowChallengeDialog(true)}
                >
                  Create Challenge
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Available Dojos
                      </Typography>
                      {mockDojos.map((dojo) => (
                        <Box
                          key={dojo.id}
                          sx={{
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                          onClick={() => handleDojoSelect(dojo)}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="body1">{dojo.name}</Typography>
                            <Chip
                              label={dojo.status}
                              color={
                                dojo.status === 'available'
                                  ? 'success'
                                  : dojo.status === 'controlled'
                                    ? 'warning'
                                    : 'error'
                              }
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {dojo.distance} km away
                            {dojo.controller &&
                              ` • Controlled by ${dojo.controller}`}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Active Challenges
                      </Typography>
                      {gameState?.activeChallenges?.length > 0 ? (
                        gameState.activeChallenges.map((challenge: any) => (
                          <Box
                            key={challenge.id}
                            sx={{
                              mb: 2,
                              p: 2,
                              bgcolor: 'grey.50',
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body1" fontWeight="bold">
                              {challenge.type} Challenge
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Status: {challenge.status}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No active challenges
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6">Territory Control System</Typography>
                <Button
                  variant="contained"
                  startIcon={<LocationOn />}
                  onClick={() => setShowTerritoryDialog(true)}
                >
                  Manage Territories
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Territory Map
                      </Typography>
                      <Box
                        sx={{
                          height: 300,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Interactive territory map would be displayed here
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Territory Stats
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Controlled Territories
                        </Typography>
                        <Typography variant="h4" color="primary">
                          {gameState?.territoryControl?.controlledDojos
                            ?.length || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Influence
                        </Typography>
                        <Typography variant="h4" color="secondary">
                          {gameState?.territoryControl?.influence || 0}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6">Player Movement System</Typography>
                <Button
                  variant="contained"
                  startIcon={<Person />}
                  onClick={() => setShowMovementDialog(true)}
                >
                  Travel Options
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Current Location
                      </Typography>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body1">
                          {gameState?.currentLocation?.dojoName ||
                            'Unknown Location'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Lat:{' '}
                          {gameState?.currentLocation?.latitude?.toFixed(4)},
                          Lng:{' '}
                          {gameState?.currentLocation?.longitude?.toFixed(4)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Movement Status
                      </Typography>
                      {gameState?.isTraveling ? (
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'warning.light',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body1"
                            color="warning.contrastText"
                          >
                            Traveling to {gameState.destination?.dojoName}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="warning.contrastText"
                          >
                            ETA:{' '}
                            {gameState.destination?.estimatedArrival?.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'success.light',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body1"
                            color="success.contrastText"
                          >
                            Stationary
                          </Typography>
                          <Typography
                            variant="body2"
                            color="success.contrastText"
                          >
                            Ready to travel
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6">Achievement System</Typography>
                <Button
                  variant="contained"
                  startIcon={<TrendingUp />}
                  onClick={() => setShowAchievementDialog(true)}
                >
                  View Achievements
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recent Achievements
                      </Typography>
                      <Box
                        sx={{
                          height: 300,
                          bgcolor: 'grey.100',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Achievement feed would be displayed here
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Achievement Stats
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Achievements
                        </Typography>
                        <Typography variant="h4" color="primary">
                          12/25
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Completion Rate
                        </Typography>
                        <Typography variant="h4" color="secondary">
                          48%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6">Real-Time Match Tracking</Typography>
                <Button
                  variant="contained"
                  startIcon={<SportsEsports />}
                  onClick={() => setShowMatchTracker(true)}
                >
                  Start Match Tracker
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Match Status
                      </Typography>
                      {gameState?.matchState?.isInMatch ? (
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'success.light',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body1"
                            color="success.contrastText"
                          >
                            Match in Progress
                          </Typography>
                          <Typography
                            variant="body2"
                            color="success.contrastText"
                          >
                            Tracking active match
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}
                        >
                          <Typography variant="body1">
                            No active match
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Start a match to begin tracking
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </Container>
      </PageBackground>

      {/* Dialogs */}
      <Dialog
        open={showChallengeDialog}
        onClose={() => setShowChallengeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Create Challenge
          <IconButton
            aria-label="close"
            onClick={() => setShowChallengeDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <ChallengeCreationPanel
            dojoId={selectedDojo?.id || 'dojo-1'}
            dojoName={selectedDojo?.name || 'Unknown Dojo'}
            onChallengeCreated={(challenge) => {
              addNotification(`Challenge created successfully!`);
              setShowChallengeDialog(false);
            }}
            onClose={() => setShowChallengeDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showTerritoryDialog}
        onClose={() => setShowTerritoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Territory Control
          <IconButton
            aria-label="close"
            onClick={() => setShowTerritoryDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TerritoryControlPanel
            dojoId={selectedDojo?.id || 'dojo-1'}
            dojoName={selectedDojo?.name || 'Unknown Dojo'}
            currentController={
              selectedDojo?.controller
                ? { id: 'controller-1', name: selectedDojo.controller }
                : undefined
            }
            playerClanId="clan-1"
            onTerritoryClaimed={(territory) => {
              addNotification(`Territory claimed successfully!`);
              setShowTerritoryDialog(false);
            }}
            onTerritoryContested={(challenge) => {
              addNotification(`Territory contested!`);
              setShowTerritoryDialog(false);
            }}
            onClose={() => setShowTerritoryDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showMovementDialog}
        onClose={() => setShowMovementDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Player Movement
          <IconButton
            aria-label="close"
            onClick={() => setShowMovementDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PlayerMovementPanel
            currentLocation={
              gameState?.currentLocation || { latitude: 0, longitude: 0 }
            }
            onTravelStarted={(movement) => {
              addNotification(
                `Travel started to ${movement.toLocation.dojoName}`
              );
              setShowMovementDialog(false);
            }}
            onTravelCompleted={(movement) => {
              addNotification(`Arrived at ${movement.toLocation.dojoName}`);
            }}
            onTravelCancelled={(movement) => {
              addNotification(`Travel cancelled`);
            }}
            onClose={() => setShowMovementDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAchievementDialog}
        onClose={() => setShowAchievementDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Achievements
          <IconButton
            aria-label="close"
            onClick={() => setShowAchievementDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <AchievementPanel
            onAchievementUnlocked={(achievement) => {
              addNotification(`Achievement unlocked: ${achievement.title}`);
            }}
            onClose={() => setShowAchievementDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showMatchTracker}
        onClose={() => setShowMatchTracker(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Real-Time Match Tracker
          <IconButton
            aria-label="close"
            onClick={() => setShowMatchTracker(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <RealTimeMatchTracker
            matchId="match-1"
            onMatchStart={(match) => {
              addNotification(
                `Match started: ${match.player1.name} vs ${match.player2.name}`
              );
            }}
            onMatchEnd={(match) => {
              addNotification(`Match ended: ${match.winner} wins!`);
              setShowMatchTracker(false);
            }}
            onClose={() => setShowMatchTracker(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default GameMechanicsPage;
