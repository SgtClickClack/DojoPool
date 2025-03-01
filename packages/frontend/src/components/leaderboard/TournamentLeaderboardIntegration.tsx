import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Grid,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import PublishIcon from '@mui/icons-material/Publish';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StreamIcon from '@mui/icons-material/Stream';
import PauseIcon from '@mui/icons-material/Pause';
import { TournamentLeaderboard } from './TournamentLeaderboard';
import { GlobalLeaderboard } from './GlobalLeaderboard';
import leaderboardService, { TournamentLeaderboardEntry } from '../../services/leaderboardService';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import { websocketService } from '../../services/websocketService';
import { useTheme } from '@mui/material/styles';
import { analyticsService } from '../../services/analytics';

interface TournamentLeaderboardIntegrationProps {
  tournamentId: string;
  allowSubmission?: boolean;
  showGlobalLeaderboard?: boolean;
}

/**
 * TournamentLeaderboardIntegration component
 * 
 * This component integrates tournament results with the global leaderboard system.
 * It displays the tournament leaderboard and provides functionality to submit final results
 * to the blockchain and update the global leaderboard.
 */
export const TournamentLeaderboardIntegration: React.FC<TournamentLeaderboardIntegrationProps> = ({
  tournamentId,
  allowSubmission = false,
  showGlobalLeaderboard = true
}) => {
  const theme = useTheme();

  // State variables
  const [tournamentData, setTournamentData] = useState<{
    details: any | null;
    leaderboardEntries: TournamentLeaderboardEntry[];
  }>({
    details: null,
    leaderboardEntries: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Ref to store the unsubscribe function for WebSocket updates
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load tournament data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tournament details
        const details = await crossChainTournamentService.getTournamentDetails(tournamentId);
        
        if (!details) {
          throw new Error('Failed to load tournament details');
        }

        // Fetch tournament leaderboard
        const leaderboardData = await leaderboardService.getTournamentLeaderboard(tournamentId);

        setTournamentData({
          details,
          leaderboardEntries: leaderboardData.entries
        });
        
        // Set last updated timestamp
        setLastUpdated(leaderboardData.lastUpdated || new Date().toISOString());

        analyticsService.trackEvent('tournament_integration_loaded', {
          tournamentId,
          tournamentName: details.name,
          participantsCount: details.participantsCount
        });
      } catch (err) {
        console.error('Error loading tournament data:', err);
        setError('Failed to load tournament data. Please try again.');
        
        analyticsService.trackEvent('tournament_integration_error', {
          tournamentId,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      loadData();
    }
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tournamentId, refreshTrigger]);
  
  // Effect to manage WebSocket subscription for real-time updates
  useEffect(() => {
    // Clean up previous subscription if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Only subscribe if live updates are enabled and tournament is in progress
    if (liveUpdatesEnabled && tournamentData.details?.status === 'in_progress') {
      // Connect to WebSocket if not already connected
      if (!websocketService.isConnected()) {
        websocketService.connect({
          onError: () => {
            setError('Failed to connect to real-time updates. Data may be delayed.');
            setLiveUpdatesEnabled(false);
          }
        });
      }
      
      // Subscribe to tournament updates
      unsubscribeRef.current = websocketService.subscribe('tournament_update', (data: any) => {
        // Check if update is for this tournament
        if (data.tournamentId === tournamentId) {
          if (data.type === 'leaderboard_update') {
            // Update leaderboard entries
            setTournamentData(prev => ({
              ...prev,
              leaderboardEntries: data.entries
            }));
            setLastUpdated(new Date().toISOString());
            setHasNewUpdate(true);
            
            // Visual indicator that we received an update
            setTimeout(() => {
              setHasNewUpdate(false);
            }, 2000);
            
            analyticsService.trackEvent('tournament_live_update_received', {
              tournamentId,
              updateType: 'leaderboard'
            });
          } else if (data.type === 'tournament_status_update') {
            // Update tournament details
            setTournamentData(prev => ({
              ...prev,
              details: {
                ...prev.details,
                ...data.details
              }
            }));
            
            analyticsService.trackEvent('tournament_live_update_received', {
              tournamentId,
              updateType: 'status'
            });
          }
        }
      });
      
      // Send message to subscribe to this tournament's updates
      websocketService.send({
        type: 'tournament_update',
        data: {
          action: 'subscribe',
          tournamentId
        }
      });
      
      analyticsService.trackEvent('tournament_live_updates_enabled', { tournamentId });
    }
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        
        // Send unsubscribe message if WebSocket is still connected
        if (websocketService.isConnected()) {
          websocketService.send({
            type: 'tournament_update',
            data: {
              action: 'unsubscribe',
              tournamentId
            }
          });
        }
      }
    };
  }, [liveUpdatesEnabled, tournamentId, tournamentData.details?.status]);

  // Handle form submission to update global leaderboard
  const handleSubmitResults = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Format results for submission
      const results = tournamentData.leaderboardEntries.map(entry => ({
        playerId: entry.userId,
        finalRank: entry.rank,
        prize: calculatePrize(entry.rank, tournamentData.details.prizePool)
      }));

      analyticsService.trackEvent('tournament_results_submission_started', {
        tournamentId,
        tournamentName: tournamentData.details?.name,
        resultsCount: results.length
      });

      // Submit results to blockchain
      const submitted = await crossChainTournamentService.submitTournamentResults(
        tournamentId,
        results,
        tournamentData.details.isCrossChain
      );

      if (submitted) {
        setSuccess('Tournament results submitted successfully! Global leaderboard will be updated shortly.');
        setShowConfirmDialog(false);
        
        analyticsService.trackEvent('tournament_results_submission_success', {
          tournamentId,
          tournamentName: tournamentData.details?.name
        });

        // Refresh data after submission
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1);
        }, 2000);
      } else {
        throw new Error('Failed to submit tournament results');
      }
    } catch (err) {
      console.error('Error submitting tournament results:', err);
      setError('Failed to submit tournament results. Please try again.');
      
      analyticsService.trackEvent('tournament_results_submission_error', {
        tournamentId,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate prize based on rank and total prize pool
  const calculatePrize = (rank: number, prizePool: string): string => {
    const totalPrize = parseFloat(prizePool);
    
    // Example distribution: 1st: 50%, 2nd: 30%, 3rd: 15%, 4th: 5%
    switch (rank) {
      case 1: return (totalPrize * 0.5).toString();
      case 2: return (totalPrize * 0.3).toString();
      case 3: return (totalPrize * 0.15).toString();
      case 4: return (totalPrize * 0.05).toString();
      default: return "0";
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Toggle live updates
  const handleToggleLiveUpdates = () => {
    setLiveUpdatesEnabled(prev => !prev);
  };
  
  // Format last updated time as a human-readable string
  const formattedLastUpdated = () => {
    if (!lastUpdated) return 'Not yet updated';
    
    const date = new Date(lastUpdated);
    return `Last updated: ${date.toLocaleTimeString()}`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Error alert */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success alert */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Tournament Results section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
          boxShadow: hasNewUpdate ? `0 0 8px ${theme.palette.primary.main}` : undefined
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEventsIcon 
              sx={{ 
                color: theme.palette.primary.main, 
                mr: 1.5,
                fontSize: '2rem'
              }} 
            />
            <Typography 
              variant="h5" 
              component="h1"
              sx={{ 
                fontWeight: 'bold',
                fontFamily: 'var(--martial-arts-font)',
                color: theme.palette.primary.main 
              }}
            >
              {loading ? 'Loading Tournament...' : tournamentData.details?.name || 'Tournament Results'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!loading && tournamentData.details?.status === 'in_progress' && (
              <Tooltip title={liveUpdatesEnabled ? "Disable live updates" : "Enable live updates"}>
                <Button
                  variant={liveUpdatesEnabled ? "contained" : "outlined"}
                  color={liveUpdatesEnabled ? "primary" : "inherit"}
                  size="small"
                  onClick={handleToggleLiveUpdates}
                  startIcon={liveUpdatesEnabled ? <StreamIcon /> : <PauseIcon />}
                  sx={{ mr: 1 }}
                >
                  {liveUpdatesEnabled ? "Live" : "Paused"}
                </Button>
              </Tooltip>
            )}
            
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} disabled={loading || submitting}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : tournamentData.details ? (
          <>
            {/* Tournament details */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={tournamentData.details.status.replace('_', ' ').toUpperCase()} 
                  color={
                    tournamentData.details.status === 'completed' ? 'success' : 
                    tournamentData.details.status === 'in_progress' ? 'primary' : 
                    tournamentData.details.status === 'registration' ? 'info' : 'default'
                  }
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Prize Pool</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {tournamentData.details.prizePool} {tournamentData.details.isNativeChain === 'ethereum' ? 'ETH' : 'SOL'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Participants</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                  {tournamentData.details.participantsCount} / {tournamentData.details.maxParticipants}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Chain</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 0.5, textTransform: 'capitalize' }}>
                  {tournamentData.details.isNativeChain}
                  {tournamentData.details.isCrossChain && (
                    <Chip 
                      label="Cross-Chain" 
                      size="small" 
                      color="secondary" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Last updated timestamp */}
            {lastUpdated && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  mb: 1,
                  opacity: 0.7,
                  fontSize: '0.875rem'
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontStyle: 'italic',
                    animation: hasNewUpdate ? 'pulse 2s' : 'none'
                  }}
                >
                  {formattedLastUpdated()}
                  {liveUpdatesEnabled && tournamentData.details.status === 'in_progress' && (
                    <Badge
                      color="primary"
                      variant="dot"
                      sx={{ 
                        ml: 1,
                        '& .MuiBadge-badge': {
                          animation: 'pulse 1.5s infinite'
                        }
                      }}
                    />
                  )}
                </Typography>
              </Box>
            )}
            
            {/* Tournament Leaderboard */}
            <TournamentLeaderboard 
              tournamentId={tournamentId} 
              showTitle={false}
              enableLiveUpdates={liveUpdatesEnabled && tournamentData.details.status === 'in_progress'}
            />
            
            {/* Submit Results Button */}
            {allowSubmission && tournamentData.details.status === 'in_progress' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PublishIcon />}
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={submitting || tournamentData.leaderboardEntries.length === 0}
                  sx={{ 
                    fontWeight: 'bold',
                    px: 4,
                    py: 1
                  }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Final Results'}
                </Button>
              </Box>
            )}

            {/* Confirmation Dialog */}
            <Dialog
              open={showConfirmDialog}
              onClose={() => setShowConfirmDialog(false)}
              aria-labelledby="confirm-dialog-title"
            >
              <DialogTitle id="confirm-dialog-title">
                Confirm Tournament Results Submission
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" paragraph>
                  You are about to submit the final results for this tournament. This action cannot be undone. 
                  The results will be recorded on the blockchain and used to update the global leaderboard.
                </Typography>
                <Typography variant="body1" paragraph fontWeight="bold">
                  Prize distribution will be as follows:
                </Typography>
                <List>
                  {tournamentData.leaderboardEntries.slice(0, 4).map((entry) => (
                    <ListItem key={entry.id}>
                      <ListItemAvatar>
                        <Avatar src={entry.avatar}>
                          {entry.username.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${entry.rank}. ${entry.username}`}
                        secondary={`Prize: ${calculatePrize(entry.rank, tournamentData.details.prizePool)} ${
                          tournamentData.details.isNativeChain === 'ethereum' ? 'ETH' : 'SOL'
                        }`}
                      />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowConfirmDialog(false)} color="inherit">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitResults} 
                  color="primary" 
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Confirm Submission'}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        ) : (
          <Alert severity="error">
            Failed to load tournament data. Please check the tournament ID and try again.
          </Alert>
        )}
      </Paper>

      {/* Global Leaderboard section (optional) */}
      {showGlobalLeaderboard && (
        <>
          <Divider sx={{ my: 4 }} />
          <GlobalLeaderboard 
            title="Global Rankings" 
            initialTimeFrame="weekly"
            gameType={tournamentData.details?.gameType}
          />
        </>
      )}
      
      {/* CSS animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default TournamentLeaderboardIntegration; 