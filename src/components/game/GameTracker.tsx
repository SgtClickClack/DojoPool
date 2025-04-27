import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Flag as FoulIcon,
  Info as InfoIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { useGameState } from '../../hooks/useGameState';
import { useGameRules } from '../../hooks/useGameRules';
import { GameState, Player, Foul, Rule } from '../../types/game';

interface GameTrackerProps {
  matchId: string;
  player1: Player;
  player2: Player;
}

export const GameTracker: React.FC<GameTrackerProps> = ({
  matchId,
  player1,
  player2,
}) => {
  const theme = useTheme();
  const { gameState, updateScore, addFoul, undoLastAction } = useGameState(matchId);
  const { rules, checkRuleViolation } = useGameRules();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  useEffect(() => {
    // Subscribe to real-time game updates
    // This will be implemented with WebSocket connection
  }, [matchId]);

  const handleScoreChange = async (playerId: string, increment: boolean) => {
    try {
      setError(null);
      await updateScore(playerId, increment);
    } catch (err) {
      setError('Failed to update score. Please try again.');
    }
  };

  const handleFoul = async (playerId: string, foulType: string) => {
    try {
      setError(null);
      await addFoul(playerId, foulType);
    } catch (err) {
      setError('Failed to record foul. Please try again.');
    }
  };

  const handleUndo = async () => {
    try {
      setError(null);
      await undoLastAction();
    } catch (err) {
      setError('Failed to undo last action. Please try again.');
    }
  };

  const renderPlayerCard = (player: Player, isPlayer1: boolean) => (
    <Card
      sx={{
        height: '100%',
        background: theme.palette.background.paper,
        borderRadius: 2,
        borderLeft: isPlayer1 ? `4px solid ${theme.palette.primary.main}` : 'none',
        borderRight: !isPlayer1 ? `4px solid ${theme.palette.secondary.main}` : 'none',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{player.name}</Typography>
          <Chip
            label={`Fouls: ${gameState?.fouls[player.id]?.length || 0}`}
            color={gameState?.fouls[player.id]?.length >= 3 ? 'error' : 'default'}
          />
        </Box>

        <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
          <IconButton
            onClick={() => handleScoreChange(player.id, false)}
            disabled={!gameState?.scores[player.id]}
          >
            <RemoveIcon />
          </IconButton>
          <Typography variant="h3" sx={{ mx: 3 }}>
            {gameState?.scores[player.id] || 0}
          </Typography>
          <IconButton onClick={() => handleScoreChange(player.id, true)}>
            <AddIcon />
          </IconButton>
        </Box>

        <Box display="flex" justifyContent="center" gap={1}>
          <Button
            variant="outlined"
            startIcon={<FoulIcon />}
            onClick={() => handleFoul(player.id, 'standard')}
          >
            Add Foul
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderRulesDialog = () => (
    <Dialog
      open={showRules}
      onClose={() => setShowRules(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Game Rules</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {rules.map((rule) => (
            <Grid item xs={12} key={rule.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
                onClick={() => setSelectedRule(rule)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {rule.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rule.shortDescription}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowRules(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderRuleDetailsDialog = () => (
    <Dialog
      open={!!selectedRule}
      onClose={() => setSelectedRule(null)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{selectedRule?.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          {selectedRule?.description}
        </Typography>
        {selectedRule?.examples?.map((example, index) => (
          <Typography key={index} variant="body2" color="text.secondary" paragraph>
            Example {index + 1}: {example}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSelectedRule(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Game Tracker</Typography>
        <Box>
          <IconButton onClick={() => setShowRules(true)} sx={{ mr: 1 }}>
            <InfoIcon />
          </IconButton>
          <IconButton onClick={handleUndo}>
            <UndoIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderPlayerCard(player1, true)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderPlayerCard(player2, false)}
        </Grid>
      </Grid>

      {renderRulesDialog()}
      {renderRuleDetailsDialog()}
    </Box>
  );
}; 