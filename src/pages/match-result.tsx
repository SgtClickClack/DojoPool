import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { MatchAnalysisPanel } from '../components/match/MatchAnalysisPanel';
import { finalizeMatch, getMatchWithAnalysis } from '../services/APIService';
import type { MatchWithAnalysis } from '../types/match';

export default function MatchResultPage() {
  const router = useRouter();
  const { matchId } = router.query;

  const [match, setMatch] = useState<MatchWithAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    if (matchId && typeof matchId === 'string') {
      fetchMatchDetails(matchId);
    }
  }, [matchId]);

  const fetchMatchDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const matchData = await getMatchWithAnalysis(id);
      setMatch(matchData);
    } catch (err) {
      setError('Failed to fetch match details. Please try again.');
      console.error('Error fetching match:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeMatch = async (
    winnerId: string,
    scoreA: number,
    scoreB: number
  ) => {
    if (!matchId || typeof matchId !== 'string') return;

    try {
      setAnalysisLoading(true);
      await finalizeMatch(matchId, winnerId, scoreA, scoreB);
      // Refresh match data to get the updated analysis
      await fetchMatchDetails(matchId);
    } catch (err) {
      setError('Failed to finalize match. Please try again.');
      console.error('Error finalizing match:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!match) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Match not found. Please check the URL and try again.
        </Alert>
      </Container>
    );
  }

  const isCompleted = match.status === 'COMPLETED';
  const winner =
    match.winnerId === match.playerAId ? match.playerA : match.playerB;
  const loser =
    match.winnerId === match.playerBId ? match.playerA : match.playerB;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Match Header */}
      <Typography variant="h3" component="h1" gutterBottom>
        Match Result
      </Typography>

      {/* Match Details Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* Player A */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                  src={match.playerA?.avatarUrl}
                >
                  {match.playerA?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {match.playerA?.username || 'Player A'}
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
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
                <Typography variant="h4" color="text.secondary" gutterBottom>
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
                <Avatar
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                  src={match.playerB?.avatarUrl}
                >
                  {match.playerB?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {match.playerB?.username || 'Player B'}
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  {match.scoreB || 0}
                </Typography>
                {isCompleted && match.winnerId === match.playerBId && (
                  <Chip label="Winner" color="success" size="small" />
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Match Info */}
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={2}>
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
        </CardContent>
      </Card>

      {/* AI Analysis Panel */}
      <MatchAnalysisPanel
        aiAnalysisJson={match.aiAnalysisJson}
        isLoading={analysisLoading}
      />

      {/* Match Finalization (if not completed) */}
      {!isCompleted && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Finalize Match
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete the match to generate AI analysis
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`${match.playerA?.username || 'Player A'} Wins`}
                color="primary"
                variant="outlined"
                onClick={() => handleFinalizeMatch(match.playerAId, 9, 6)}
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label={`${match.playerB?.username || 'Player B'} Wins`}
                color="primary"
                variant="outlined"
                onClick={() => handleFinalizeMatch(match.playerBId, 6, 9)}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
