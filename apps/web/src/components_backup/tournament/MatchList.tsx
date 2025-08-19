import {
  Edit,
  EmojiEvents,
  SportsEsports,
  Visibility,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoreUpdateModal from './ScoreUpdateModal';

interface Match {
  id: string;
  round: number;
  status: string;
  playerA: {
    id: string;
    username: string;
  };
  playerB: {
    id: string;
    username: string;
  };
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  loser?: string;
}

interface MatchListProps {
  matches: Match[];
  isLoading?: boolean;
  onMatchUpdated?: () => void;
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  isLoading = false,
  onMatchUpdated,
}) => {
  const navigate = useNavigate();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateScore = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
    setUpdateError(null);
  };

  const handleViewMatch = (matchId: string) => {
    navigate(`/matches/${matchId}`);
  };

  const handleScoreSubmit = async (
    scoreA: number,
    scoreB: number,
    winnerId: string
  ) => {
    if (!selectedMatch) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const response = await fetch(
        `http://localhost:8080/v1/tournaments/matches/${selectedMatch.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scoreA,
            scoreB,
            winnerId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update match score');
      }

      // Close modal and refresh matches
      setIsModalOpen(false);
      setSelectedMatch(null);

      // Notify parent component to refresh matches
      if (onMatchUpdated) {
        onMatchUpdated();
      }
    } catch (err) {
      console.error('Failed to update match score:', err);
      setUpdateError(
        err instanceof Error ? err.message : 'Failed to update match score'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    setUpdateError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'LIVE':
        return 'warning';
      case 'SCHEDULED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'LIVE':
        return 'Live';
      case 'SCHEDULED':
        return 'Scheduled';
      default:
        return status;
    }
  };

  const getRoundLabel = (round: number) => {
    switch (round) {
      case 1:
        return 'First Round';
      case 2:
        return 'Quarter Finals';
      case 3:
        return 'Semi Finals';
      case 4:
        return 'Finals';
      default:
        return `Round ${round}`;
    }
  };

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  return (
    <>
      <Card
        sx={{
          background: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid #00a8ff',
          borderRadius: '15px',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h5"
            sx={{ color: '#00a8ff', mb: 3, fontWeight: 600 }}
          >
            Tournament Bracket
          </Typography>

          {Object.entries(matchesByRound)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, roundMatches]) => (
              <Box key={round} sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00ff9d',
                    mb: 2,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SportsEsports sx={{ fontSize: 20 }} />
                  {getRoundLabel(Number(round))}
                </Typography>

                <Grid container spacing={2}>
                  {roundMatches.map((match) => (
                    <Grid item xs={12} md={6} key={match.id}>
                      <Card
                        sx={{
                          background: 'rgba(20, 20, 20, 0.8)',
                          border: '1px solid #333',
                          borderRadius: '10px',
                          '&:hover': {
                            borderColor: '#00a8ff',
                            boxShadow: '0 0 10px rgba(0, 168, 255, 0.3)',
                          },
                          cursor: 'pointer',
                        }}
                        onClick={() => handleViewMatch(match.id)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Chip
                              label={getStatusText(match.status)}
                              color={getStatusColor(match.status)}
                              size="small"
                              sx={{ fontSize: '0.75rem' }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: '#888' }}
                            >
                              Match #{match.id.slice(-6)}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{
                                p: 1,
                                borderRadius: '5px',
                                background:
                                  match.winner === match.playerA.id
                                    ? 'rgba(0, 255, 157, 0.1)'
                                    : 'transparent',
                                border:
                                  match.winner === match.playerA.id
                                    ? '1px solid #00ff9d'
                                    : '1px solid transparent',
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{
                                  color: '#fff',
                                  fontWeight:
                                    match.winner === match.playerA.id
                                      ? 600
                                      : 400,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    color: '#00a8ff',
                                    textDecoration: 'underline',
                                  },
                                }}
                                onClick={() =>
                                  navigate(`/players/${match.playerA.id}`)
                                }
                              >
                                {match.playerA.username}
                              </Typography>
                              {match.scoreA !== undefined && (
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color:
                                      match.winner === match.playerA.id
                                        ? '#00ff9d'
                                        : '#fff',
                                    fontWeight: 600,
                                  }}
                                >
                                  {match.scoreA}
                                </Typography>
                              )}
                            </Box>

                            <Box
                              sx={{
                                textAlign: 'center',
                                my: 1,
                                color: '#888',
                                fontSize: '0.875rem',
                              }}
                            >
                              vs
                            </Box>

                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{
                                p: 1,
                                borderRadius: '5px',
                                background:
                                  match.winner === match.playerB.id
                                    ? 'rgba(0, 255, 157, 0.1)'
                                    : 'transparent',
                                border:
                                  match.winner === match.playerB.id
                                    ? '1px solid #00ff9d'
                                    : '1px solid transparent',
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{
                                  color: '#fff',
                                  fontWeight:
                                    match.winner === match.playerB.id
                                      ? 600
                                      : 400,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    color: '#00a8ff',
                                    textDecoration: 'underline',
                                  },
                                }}
                                onClick={() =>
                                  navigate(`/players/${match.playerB.id}`)
                                }
                              >
                                {match.playerB.username}
                              </Typography>
                              {match.scoreB !== undefined && (
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color:
                                      match.winner === match.playerB.id
                                        ? '#00ff9d'
                                        : '#fff',
                                    fontWeight: 600,
                                  }}
                                >
                                  {match.scoreB}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {match.winner && (
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              sx={{
                                p: 1,
                                borderRadius: '5px',
                                background: 'rgba(255, 215, 0, 0.1)',
                                border: '1px solid #ffd700',
                                mb: 2,
                              }}
                            >
                              <EmojiEvents
                                sx={{ color: '#ffd700', fontSize: 16 }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#ffd700',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    color: '#fff',
                                    textDecoration: 'underline',
                                  },
                                }}
                                onClick={() => {
                                  const winnerId =
                                    match.winner === match.playerA.id
                                      ? match.playerA.id
                                      : match.playerB.id;
                                  navigate(`/players/${winnerId}`);
                                }}
                              >
                                Winner:{' '}
                                {match.winner === match.playerA.id
                                  ? match.playerA.username
                                  : match.playerB.username}
                              </Typography>
                            </Box>
                          )}

                          {/* Action Buttons */}
                          <Box display="flex" gap={1}>
                            {/* View Match Button */}
                            <Button
                              variant="outlined"
                              fullWidth
                              startIcon={<Visibility />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewMatch(match.id);
                              }}
                              sx={{
                                color: '#00a8ff',
                                borderColor: '#00a8ff',
                                '&:hover': {
                                  borderColor: '#00ff9d',
                                  color: '#00ff9d',
                                },
                              }}
                            >
                              View Match
                            </Button>

                            {/* Update Score Button - Only show for SCHEDULED or LIVE matches */}
                            {(match.status === 'SCHEDULED' ||
                              match.status === 'LIVE') && (
                              <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Edit />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateScore(match);
                                }}
                                sx={{
                                  color: '#00ff9d',
                                  borderColor: '#00ff9d',
                                  '&:hover': {
                                    borderColor: '#00a8ff',
                                    color: '#00a8ff',
                                  },
                                }}
                              >
                                Update Score
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {Number(round) < Object.keys(matchesByRound).length && (
                  <Divider sx={{ mt: 3, borderColor: '#333' }} />
                )}
              </Box>
            ))}
        </CardContent>
      </Card>

      {/* Score Update Modal */}
      {selectedMatch && (
        <ScoreUpdateModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleScoreSubmit}
          match={selectedMatch}
          isSubmitting={isUpdating}
          error={updateError}
        />
      )}
    </>
  );
};

export default MatchList;
