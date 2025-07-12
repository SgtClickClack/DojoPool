import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  EmojiEvents,
  LocationOn,
  Person,
  Timer,
  Star,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { ChallengeService } from '../../services/ChallengeService';

interface ChallengeCreationPanelProps {
  dojoId: string;
  dojoName: string;
  onChallengeCreated?: (challenge: any) => void;
  onClose?: () => void;
}

interface DojoPlayer {
  id: string;
  name: string;
  level: number;
  winRate: number;
  isTopTen: boolean;
  isMaster: boolean;
}

const ChallengeCreationPanel: React.FC<ChallengeCreationPanelProps> = ({
  dojoId,
  dojoName,
  onChallengeCreated,
  onClose
}) => {
  const [challengeType, setChallengeType] = useState<'pilgrimage' | 'gauntlet' | 'duel'>('duel');
  const [selectedDefender, setSelectedDefender] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<DojoPlayer[]>([]);

  // Mock data for demonstration
  const mockPlayers: DojoPlayer[] = [
    { id: 'player-1', name: 'ShadowStriker', level: 18, winRate: 75.2, isTopTen: true, isMaster: true },
    { id: 'player-2', name: 'CueMaster', level: 16, winRate: 68.9, isTopTen: true, isMaster: false },
    { id: 'player-3', name: 'PoolShark', level: 14, winRate: 62.3, isTopTen: false, isMaster: false },
    { id: 'player-4', name: 'BreakMaster', level: 15, winRate: 71.1, isTopTen: true, isMaster: false },
    { id: 'player-5', name: 'RackEmUp', level: 13, winRate: 58.7, isTopTen: false, isMaster: false }
  ];

  useEffect(() => {
    setAvailablePlayers(mockPlayers);
  }, []);

  const getChallengeRequirements = (type: string) => {
    return ChallengeService.getChallengeRequirements(type);
  };

  const getChallengeDescription = (type: string) => {
    const descriptions = {
      pilgrimage: 'Embark on a legendary journey to defeat the Dojo Master and claim this venue as your own. This is the ultimate test of skill and determination.',
      gauntlet: 'Face a series of challenging matches against the venue\'s top players. Prove your worth through multiple victories.',
      duel: 'Direct challenge against a specific player. A straightforward test of skill between two competitors.'
    };
    return descriptions[type as keyof typeof descriptions];
  };

  const getChallengeRewards = (type: string) => {
    const rewards = {
      pilgrimage: { xp: 500, coins: 200, title: 'Dojo Master' },
      gauntlet: { xp: 300, coins: 150, title: 'Gauntlet Champion' },
      duel: { xp: 100, coins: 50, title: 'Duel Victor' }
    };
    return rewards[type as keyof typeof rewards];
  };

  const handleCreateChallenge = async () => {
    if (!selectedDefender) {
      setError('Please select a defender for your challenge');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const challenge = await ChallengeService.createChallenge({
        type: challengeType,
        defenderId: selectedDefender,
        dojoId,
        requirements: getChallengeRequirements(challengeType)
      });

      setSuccess('Challenge created successfully!');
      onChallengeCreated?.(challenge);
      
      // Reset form
      setSelectedDefender('');
      setChallengeType('duel');
      
      setTimeout(() => {
        setSuccess('');
        onClose?.();
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const requirements = getChallengeRequirements(challengeType);
  const description = getChallengeDescription(challengeType);
  const rewards = getChallengeRewards(challengeType);

  return (
    <Card sx={{ maxWidth: 600, width: '100%' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents color="primary" />
          Create Challenge
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {dojoName}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Challenge Type Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Challenge Type</InputLabel>
              <Select
                value={challengeType}
                label="Challenge Type"
                onChange={(e) => setChallengeType(e.target.value as any)}
              >
                <MenuItem value="duel">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    Duel
                  </Box>
                </MenuItem>
                <MenuItem value="gauntlet">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star />
                    Gauntlet
                  </Box>
                </MenuItem>
                <MenuItem value="pilgrimage">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn />
                    Pilgrimage
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Challenge Description */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Requirements */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={`Win ${requirements.wins} games`}
                  secondary="Total victories needed"
                />
              </ListItem>
              {requirements.topTenDefeats > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <Star color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Defeat ${requirements.topTenDefeats} Top Ten players`}
                    secondary="Must defeat ranked players"
                  />
                </ListItem>
              )}
              {requirements.masterDefeat > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <EmojiEvents color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Defeat the Dojo Master`}
                    secondary="Ultimate challenge requirement"
                  />
                </ListItem>
              )}
            </List>
          </Grid>

          {/* Rewards */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Rewards
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Star />} 
                label={`${rewards.xp} XP`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<EmojiEvents />} 
                label={`${rewards.coins} Coins`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<CheckCircle />} 
                label={rewards.title} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          </Grid>

          {/* Defender Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Defender</InputLabel>
              <Select
                value={selectedDefender}
                label="Select Defender"
                onChange={(e) => setSelectedDefender(e.target.value)}
              >
                {availablePlayers.map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">
                          {player.name} (Lv. {player.level})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Win Rate: {player.winRate}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {player.isTopTen && <Star color="primary" fontSize="small" />}
                        {player.isMaster && <EmojiEvents color="secondary" fontSize="small" />}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isLoading || !selectedDefender}
                startIcon={isLoading ? <CircularProgress size={20} /> : <EmojiEvents />}
              >
                {isLoading ? 'Creating...' : 'Create Challenge'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Challenge</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to create a {challengeType} challenge against{' '}
            {availablePlayers.find(p => p.id === selectedDefender)?.name}?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This challenge will be active for 7 days. Make sure you're ready to compete!
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowConfirmDialog(false);
              handleCreateChallenge();
            }}
          >
            Confirm Challenge
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ChallengeCreationPanel; 