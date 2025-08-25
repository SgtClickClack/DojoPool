import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import { MatchAnalysisPanel } from '../match/MatchAnalysisPanel';
import type { MatchWithAnalysis } from '../../types/match';

interface MatchResultDialogProps {
  open: boolean;
  onClose: () => void;
  match: MatchWithAnalysis | null;
}

const MatchResultDialog: React.FC<MatchResultDialogProps> = ({
  open,
  onClose,
  match,
}) => {
  if (!match) {
    return null;
  }

  const isCompleted = match.status === 'COMPLETED';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="h2">
          Match Result
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Match Summary */}
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            {/* Player A */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}>
                  {match.playerA?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {match.playerA?.username || 'Player A'}
                </Typography>
                <Typography variant="h4" color="primary">
                  {match.scoreA || 0}
                </Typography>
                {isCompleted && match.winnerId === match.playerAId && (
                  <Chip label="Winner" color="success" size="small" />
                )}
              </Box>
            </Grid>

            {/* VS */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.secondary">
                  VS
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Round {match.round}
                </Typography>
                <Chip
                  label={match.status}
                  color={isCompleted ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>

            {/* Player B */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}>
                  {match.playerB?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {match.playerB?.username || 'Player B'}
                </Typography>
                <Typography variant="h4" color="primary">
                  {match.scoreB || 0}
                </Typography>
                {isCompleted && match.winnerId === match.playerBId && (
                  <Chip label="Winner" color="success" size="small" />
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Match Info */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Venue:</strong> {match.venue?.name || 'Unknown'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Tournament:</strong>{' '}
                {match.tournament?.name || 'Unknown'}
              </Typography>
            </Grid>
            {match.startedAt && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Started:</strong>{' '}
                  {new Date(match.startedAt).toLocaleString()}
                </Typography>
              </Grid>
            )}
            {match.endedAt && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Ended:</strong>{' '}
                  {new Date(match.endedAt).toLocaleString()}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* AI Analysis Panel */}
        <MatchAnalysisPanel
          aiAnalysisJson={match.aiAnalysisJson}
          isLoading={false}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MatchResultDialog;
