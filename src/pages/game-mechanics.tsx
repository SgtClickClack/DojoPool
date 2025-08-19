import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
// import AchievementPanel from '../../../../../apps/web/src/components/game/AchievementPanel';
// import ChallengeCreationPanel from '../../../../../apps/web/src/components/game/ChallengeCreationPanel';
// import GameBalancePanel from '../../../../../apps/web/src/components/game/GameBalancePanel';
// import PlayerMovementPanel from '../../../../../apps/web/src/components/game/PlayerMovementPanel';
// import RealTimeMatchTracker from '../../../../../apps/web/src/components/game/RealTimeMatchTracker';
// import TerritoryControlPanel from '../../../../../apps/web/src/components/game/TerritoryControlPanel';
// import PerformanceOptimizationPanel from '../../../../../apps/web/src/components/performance/PerformanceOptimizationPanel';
// import GameMechanicsService from '../../../../../apps/web/src/services/GameMechanicsService';

// Advanced Components
const AdvancedChallengePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tournament');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const createTournamentChallenge = async () => {
    try {
      // const gameMechanics = new GameMechanicsService();
      // const tournament = await gameMechanics.createTournamentChallenge({
      //   name: 'Brisbane Masters Tournament',
      //   dojoId: 'dojo-1',
      //   entryFee: 100,
      //   maxParticipants: 16,
      //   bracketType: 'single_elimination',
      //   startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      //   endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      //   rules: [
      //     'Single elimination bracket',
      //     'Best of 3 games',
      //     'Standard pool rules apply',
      //     'No coaching during matches',
      //   ],
      //   requirements: {
      //     minLevel: 5,
      //     minReputation: 100,
      //     clanMembership: false,
      //   },
      // });

      showNotification(
        'Tournament "Brisbane Masters Tournament" created successfully!',
        'success'
      );
    } catch (error) {
      showNotification('Failed to create tournament challenge', 'error');
    }
  };

  const createClanChallenge = async () => {
    try {
      // TODO: Implement GameMechanicsService integration
      // const gameMechanics = new GameMechanicsService();
      // const clanChallenge = await gameMechanics.createClanChallenge({
      //   clanId: 'clan-1',
      //   clanName: 'Crimson Dragons',
      //   defendingClanId: 'clan-2',
      //   defendingClanName: 'Shadow Wolves',
      //   dojoId: 'dojo-1',
      //   territoryStakes: ['dojo-1', 'dojo-2', 'dojo-3'],
      //   diplomaticImplications: true,
      //   entryFee: 500,
      //   requirements: {
      //     minLevel: 10,
      //     minReputation: 500,
      //     clanMembership: true,
      //   },
      // });

      showNotification('Clan challenge created successfully!', 'success');
    } catch (error) {
      showNotification('Failed to create clan challenge', 'error');
    }
  };

  return (
    <Box p={6}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Advanced Challenges
      </Typography>

      <Tabs
        value={activeTab === 'tournament' ? 0 : 1}
        onChange={(event, newValue) =>
          setActiveTab(newValue === 0 ? 'tournament' : 'clan')
        }
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Tournament Challenges" />
          <Tab label="Clan Challenges" />
        </Box>

        <Box sx={{ mt: 2 }}>
          {activeTab === 'tournament' && (
            <Stack spacing={3}>
              <Box
                p={3}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Create Tournament Challenge
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Organize large-scale tournaments with multiple participants,
                  brackets, and prizes.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={createTournamentChallenge}
                >
                  Create Tournament
                </Button>
              </Box>

              <Box
                p={3}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Active Tournaments
                </Typography>
                <Stack spacing={2}>
                  <Box
                    p={2}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Brisbane Masters
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          16 participants • Single Elimination
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Entry Fee: 100 coins
                        </Typography>
                      </Stack>
                      <Chip label="Active" color="success" size="small" />
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          )}

          {activeTab === 'clan' && (
            <Stack spacing={3}>
              <Box
                p={3}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Create Clan Challenge
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Challenge other clans for territory control and diplomatic
                  influence.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={createClanChallenge}
                >
                  Create Clan Challenge
                </Button>
              </Box>

              <Box
                p={3}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Active Clan Wars
                </Typography>
                <Stack spacing={2}>
                  <Box
                    p={2}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Crimson Dragons vs Shadow Wolves
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Territory Stakes: 3 dojos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Diplomatic Implications: High
                        </Typography>
                      </Stack>
                      <Chip label="In Progress" color="warning" size="small" />
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </Tabs>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const AdvancedMovementPanel: React.FC = () => {
  const [selectedDojo, setSelectedDojo] = useState('dojo-1');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const teleportToDojo = async (
    teleportType: 'instant' | 'ritual' | 'clan_gate'
  ) => {
    try {
      // TODO: Implement GameMechanicsService integration
      // const gameMechanics = new GameMechanicsService();
      // const movement = await gameMechanics.teleportToDojo(
      //   selectedDojo,
      //   teleportType
      // );

      showNotification(
        `Teleporting to ${selectedDojo} using ${teleportType} method`,
        'success'
      );
    } catch (error) {
      showNotification('Failed to teleport to dojo', 'error');
    }
  };

  const fastTravelToDojo = async (
    fastTravelType: 'clan_network' | 'alliance_network' | 'premium'
  ) => {
    try {
      // TODO: Implement GameMechanicsService integration
      // const gameMechanics = new GameMechanicsService();
      // const movement = await gameMechanics.fastTravelToDojo(
      //   selectedDojo,
      //   fastTravelType
      // );

      showNotification(
        `Fast traveling to ${selectedDojo} via ${fastTravelType}`,
        'success'
      );
    } catch (error) {
      showNotification('Failed to fast travel to dojo', 'error');
    }
  };

  return (
    <Box p={6}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Advanced Movement
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box
            p={3}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Teleportation
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Instant or ritual-based teleportation to any dojo.
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => teleportToDojo('instant')}
              >
                Instant Teleport (High Cost)
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => teleportToDojo('ritual')}
              >
                Ritual Teleport (Medium Cost)
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => teleportToDojo('clan_gate')}
              >
                Clan Gate (Low Cost)
              </Button>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box
            p={3}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Fast Travel Networks
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Use clan, alliance, or premium networks for faster travel.
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="warning"
                onClick={() => fastTravelToDojo('clan_network')}
              >
                Clan Network (10 min)
              </Button>
              <Button
                variant="contained"
                color="info"
                onClick={() => fastTravelToDojo('alliance_network')}
              >
                Alliance Network (15 min)
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => fastTravelToDojo('premium')}
              >
                Premium Network (5 min)
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const TerritoryAlliancePanel: React.FC = () => {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const createAlliance = async () => {
    try {
      // TODO: Implement GameMechanicsService integration
      // const gameMechanics = new GameMechanicsService();
      // const alliance = await gameMechanics.createTerritoryAlliance({
      //   name: 'Brisbane Coalition',
      //   leaderClanId: 'clan-1',
      //   memberClans: ['clan-1', 'clan-2', 'clan-3'],
      //   sharedTerritories: ['dojo-1', 'dojo-2', 'dojo-3', 'dojo-4'],
      // });

      showNotification(
        'Territory alliance "Brisbane Coalition" created successfully!',
        'success'
      );
    } catch (error) {
      showNotification('Failed to create territory alliance', 'error');
    }
  };

  const createTradeAgreement = async () => {
    try {
      // TODO: Implement GameMechanicsService integration
      // const gameMechanics = new GameMechanicsService();
      // const agreement = await gameMechanics.createTradeAgreement({
      //   clan1Id: 'clan-1',
      //   clan2Id: 'clan-2',
      //   resourceType: 'dojo_coins',
      //   amount: 100,
      //   frequency: 'daily',
      //   duration: 30,
      // });

      showNotification('Trade agreement established between clans', 'success');
    } catch (error) {
      showNotification('Failed to create trade agreement', 'error');
    }
  };

  return (
    <Box p={6}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Territory Alliances & Diplomacy
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box
            p={3}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Alliances
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Form alliances with other clans for shared territory control.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={createAlliance}
              sx={{ mb: 2 }}
            >
              Create Alliance
            </Button>

            <Box
              p={2}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'primary.50',
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Brisbane Coalition
              </Typography>
              <Typography variant="body2">
                3 member clans • 4 shared territories
              </Typography>
              <Chip
                label="Active"
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box
            p={3}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Trade Agreements
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Establish trade agreements for resource exchange.
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={createTradeAgreement}
              sx={{ mb: 2 }}
            >
              Create Trade Agreement
            </Button>

            <Box
              p={2}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'success.50',
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Daily Coin Exchange
              </Typography>
              <Typography variant="body2">
                100 coins daily • 30 days duration
              </Typography>
              <Chip
                label="Active"
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const GameMechanicsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', py: 4 }}>
        <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
          Advanced Game Mechanics Hub
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Basic Mechanics" />
            <Tab label="Advanced Challenges" />
            <Tab label="Advanced Movement" />
            <Tab label="Territory Alliances" />
            <Tab label="Achievements" />
            <Tab label="Match Tracking" />
            <Tab label="Game Balance" />
            <Tab label="Performance Optimization" />
          </Box>

          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {/* <AchievementPanel /> */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Achievement Panel</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Achievement panel temporarily unavailable. This
                        component will be implemented in a future update.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* <ChallengeCreationPanel /> */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        Challenge Creation Panel
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Challenge creation panel temporarily unavailable. This
                        component will be implemented in a future update.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            {activeTab === 1 && <AdvancedChallengePanel />}
            {activeTab === 2 && <AdvancedMovementPanel />}
            {activeTab === 3 && <TerritoryAlliancePanel />}
            {activeTab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {/* <PlayerMovementPanel /> */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        Player Movement Panel
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Player movement panel temporarily unavailable. This
                        component will be implemented in a future update.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* <RealTimeMatchTracker /> */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        Real-Time Match Tracker
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Real-time match tracker temporarily unavailable. This
                        component will be implemented in a future update.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            {activeTab === 5 && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Territory Control Panel</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Territory control panel temporarily unavailable. This
                    component will be implemented in a future update.
                  </Typography>
                </CardContent>
              </Card>
            )}
            {activeTab === 6 && (
              <Card>
                <CardContent>
                  <Typography variant="h6">Game Balance Panel</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Game balance panel temporarily unavailable. This component
                    will be implemented in a future update.
                  </Typography>
                </CardContent>
              </Card>
            )}
            {activeTab === 7 && (
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    Performance Optimization Panel
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Performance optimization panel temporarily unavailable. This
                    component will be implemented in a future update.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Tabs>
      </Box>
    </Box>
  );
};

export default GameMechanicsPage;
