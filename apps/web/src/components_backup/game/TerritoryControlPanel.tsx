import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  EmojiEvents,
  Group,
  TrendingUp,
  Warning,
  CheckCircle,
  Star,
  Person,
  Timer,
  Info,
  Close,
  Flag,
  Security,
  AttachMoney,
} from '@mui/icons-material';

interface TerritoryControlPanelProps {
  dojoId: string;
  dojoName: string;
  currentController?: {
    id: string;
    name: string;
    clanId?: string;
    clanName?: string;
  };
  playerClanId?: string;
  onTerritoryClaimed?: (territory: any) => void;
  onTerritoryContested?: (challenge: any) => void;
  onClose?: () => void;
}

interface TerritoryStats {
  influence: number;
  level: number;
  defenders: string[];
  lastContested: Date;
  revenue: number;
  activeChallenges: number;
}

const TerritoryControlPanel: React.FC<TerritoryControlPanelProps> = ({
  dojoId,
  dojoName,
  currentController,
  playerClanId,
  onTerritoryClaimed,
  onTerritoryContested,
  onClose,
}) => {
  const [territoryStats, setTerritoryStats] = useState<TerritoryStats>({
    influence: 85,
    level: 3,
    defenders: ['player-1', 'player-2', 'player-3'],
    lastContested: new Date('2025-01-28T10:30:00Z'),
    revenue: 1250,
    activeChallenges: 2,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showContestDialog, setShowContestDialog] = useState(false);
  const [contestType, setContestType] = useState<
    'standard' | 'high-stakes' | 'clan-war'
  >('standard');
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  const isPlayerControlled = currentController?.clanId === playerClanId;
  const isUnclaimed = !currentController;

  const getTerritoryLevelColor = (level: number) => {
    const colors = ['#4CAF50', '#FF9800', '#F44336', '#9C27B0'];
    return colors[Math.min(level - 1, colors.length - 1)];
  };

  const getTerritoryLevelName = (level: number) => {
    const names = ['Outpost', 'Stronghold', 'Fortress', 'Citadel'];
    return names[Math.min(level - 1, names.length - 1)];
  };

  const getContestRequirements = (type: string) => {
    const requirements = {
      standard: { minLevel: 10, minWins: 5, cost: 100 },
      'high-stakes': { minLevel: 15, minWins: 10, cost: 500 },
      'clan-war': { minLevel: 12, minWins: 8, cost: 200 },
    };
    return requirements[type as keyof typeof requirements];
  };

  const handleClaimTerritory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/territory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dojoId,
          playerId: 'current-player-id',
        }),
      });

      if (response.ok) {
        const territory = await response.json();
        onTerritoryClaimed?.(territory);
        setShowClaimDialog(false);
      } else {
        setError('Failed to claim territory');
      }
    } catch (error) {
      setError('Error claiming territory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContestTerritory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/territory/contest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dojoId,
          challengerId: 'current-player-id',
          challengeType: contestType,
        }),
      });

      if (response.ok) {
        const challenge = await response.json();
        onTerritoryContested?.(challenge);
        setShowContestDialog(false);
      } else {
        setError('Failed to contest territory');
      }
    } catch (error) {
      setError('Error contesting territory');
    } finally {
      setIsLoading(false);
    }
  };

  const mockDefenders = [
    { id: 'player-1', name: 'ShadowStriker', level: 18, isMaster: true },
    { id: 'player-2', name: 'CueMaster', level: 16, isMaster: false },
    { id: 'player-3', name: 'PoolShark', level: 14, isMaster: false },
  ];

  return (
    <Card sx={{ maxWidth: 600, width: '100%' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <LocationOn color="primary" />
            Territory Control
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {dojoName}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Territory Status */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
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
                    {isUnclaimed
                      ? 'Unclaimed Territory'
                      : 'Controlled Territory'}
                  </Typography>
                  <Chip
                    label={getTerritoryLevelName(territoryStats.level)}
                    sx={{
                      bgcolor: getTerritoryLevelColor(territoryStats.level),
                      color: 'white',
                    }}
                  />
                </Box>

                {currentController ? (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Controller:</strong> {currentController.name}
                    </Typography>
                    {currentController.clanName && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Clan:</strong> {currentController.clanName}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last Contested:</strong>{' '}
                      {territoryStats.lastContested.toLocaleDateString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    This territory is available for claiming. Be the first to
                    establish control!
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Territory Stats */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Territory Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {territoryStats.influence}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Influence
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={territoryStats.influence}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {territoryStats.revenue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Daily Revenue
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Defenders */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Defenders ({territoryStats.defenders.length})
            </Typography>
            <List dense>
              {mockDefenders.map((defender) => (
                <ListItem key={defender.id}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {defender.isMaster ? <EmojiEvents /> : <Person />}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {defender.name}
                        {defender.isMaster && (
                          <Star color="secondary" fontSize="small" />
                        )}
                      </Box>
                    }
                    secondary={`Level ${defender.level}`}
                  />
                  <ListItemSecondaryAction>
                    {defender.isMaster && (
                      <Chip label="Master" size="small" color="secondary" />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {isUnclaimed ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Flag />}
                  onClick={() => setShowClaimDialog(true)}
                  disabled={isLoading}
                >
                  Claim Territory
                </Button>
              ) : isPlayerControlled ? (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Security />}
                  disabled
                >
                  Territory Secured
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Warning />}
                    onClick={() => setShowContestDialog(true)}
                    disabled={isLoading}
                  >
                    Contest Territory
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Info />}
                  >
                    View Details
                  </Button>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {/* Claim Territory Dialog */}
      <Dialog open={showClaimDialog} onClose={() => setShowClaimDialog(false)}>
        <DialogTitle>Claim Territory</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to claim {dojoName} as your territory?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Claiming a territory will make you responsible for defending it
              against challengers. You'll earn daily revenue and gain influence
              in the area.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClaimDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleClaimTerritory}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Flag />}
          >
            {isLoading ? 'Claiming...' : 'Claim Territory'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contest Territory Dialog */}
      <Dialog
        open={showContestDialog}
        onClose={() => setShowContestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Contest Territory</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Choose how you want to contest {dojoName}:
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {(['standard', 'high-stakes', 'clan-war'] as const).map((type) => {
              const requirements = getContestRequirements(type);
              return (
                <Grid item xs={12} key={type}>
                  <Card
                    variant={contestType === type ? 'elevation' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      border: contestType === type ? 2 : 1,
                      borderColor:
                        contestType === type ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setContestType(type)}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {type.replace('-', ' ')}
                        </Typography>
                        <Chip
                          label={`${requirements.cost} Coins`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Min Level: {requirements.minLevel} | Min Wins:{' '}
                        {requirements.minWins}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Contesting a territory will initiate a challenge against the
              current controller. Make sure you're ready for the battle!
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleContestTerritory}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Warning />}
          >
            {isLoading ? 'Contesting...' : 'Contest Territory'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TerritoryControlPanel;
