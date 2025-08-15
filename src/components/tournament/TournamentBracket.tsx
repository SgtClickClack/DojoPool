import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  Divider,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  EmojiEvents,
  PlayArrow,
  Stop,
  SportsEsports
} from '@mui/icons-material';
import { TournamentBracket, TournamentMatch, TournamentParticipant } from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';
import BracketVisualization from './BracketVisualization';

interface TournamentBracketProps {
  bracket: TournamentBracket;
  onMatchClick?: (match: TournamentMatch) => void;
  onReportResult?: (match: TournamentMatch) => void;
  isAdmin?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  bracket,
  onMatchClick,
  onReportResult,
  isAdmin = false
}) => {
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'interactive'>('interactive');
  const { user } = useAuth();

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'grid' | 'interactive' | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00ff00';
      case 'in_progress':
        return '#ff00ff';
      case 'pending':
        return '#ffff00';
      case 'bye':
        return '#888888';
      default:
        return '#888888';
    }
  };

  const getParticipantDisplayName = (participant?: TournamentParticipant) => {
    if (!participant) return 'TBD';
    return participant.username || `Player ${participant.id}`;
  };

  const getWinnerStyle = (match: TournamentMatch, participant?: TournamentParticipant) => {
    if (match.winnerId && participant && match.winnerId === participant.id) {
      return {
        color: '#00ff00',
        textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
        fontWeight: 'bold'
      };
    }
    return { color: '#cccccc' };
  };

  const getLoserStyle = (match: TournamentMatch, participant?: TournamentParticipant) => {
    if (match.winnerId && participant && match.winnerId !== participant.id) {
      return {
        color: '#ff6666',
        opacity: 0.6
      };
    }
    return { color: '#cccccc' };
  };

  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '1.5rem',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px' as const,
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
      borderColor: '#00a8ff',
      boxShadow: '0 15px 40px rgba(0, 168, 255, 0.3), inset 0 0 40px rgba(0, 168, 255, 0.2)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent, rgba(0, 255, 157, 0.1), transparent)',
      transform: 'translateZ(-1px)',
    }
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const cyberButtonStyle = {
    background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    padding: '8px 16px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontSize: '0.8rem',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
      background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: '0.5s',
    },
    '&:hover::before': {
      left: '100%',
    }
  };

  const getMatchStatusChipStyle = (status: string) => ({
    background: `rgba(${status === 'pending' ? '136, 136, 136' : status === 'in_progress' ? '0, 168, 255' : status === 'completed' ? '0, 255, 157' : status === 'bye' ? '255, 0, 255' : '136, 136, 136'}, 0.2)`,
    border: `1px solid ${getMatchStatusColor(status)}`,
    color: getMatchStatusColor(status),
    textShadow: `0 0 5px ${getMatchStatusColor(status)}`,
    fontWeight: 600,
    letterSpacing: '1px',
  });

  // If interactive mode is selected and matches exist, use the new BracketVisualization
  if (viewMode === 'interactive' && bracket.rounds && bracket.rounds.flatMap(r => r.matches).length > 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ ...neonTextStyle }}>
            Tournament Bracket
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: '#00ff88',
                borderColor: '#00ff88',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                  color: '#00ff88',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 136, 0.2)',
                  },
                },
              },
            }}
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridView sx={{ mr: 1 }} />
              Grid View
            </ToggleButton>
            <ToggleButton value="interactive" aria-label="interactive view">
              <AccountTree sx={{ mr: 1 }} />
              Interactive View
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <BracketVisualization
          bracket={bracket}
          onMatchClick={onMatchClick}
          highlightUserId={user?.uid}
          enableRealTimeUpdates={true}
        />
      </Box>
    );
  }

  // Check if we have matches or need to use participant-based bracket
  if (!bracket.rounds || bracket.rounds.flatMap(r => r.matches).length === 0) {
    // Check if we have participants for fallback bracket
    if (!bracket.participantCount || bracket.participantCount < 2) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            background: 'rgba(26, 26, 46, 0.6)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#888888',
              textAlign: 'center',
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Tournament bracket will be generated when participants register
          </Typography>
        </Box>
      );
    }

    // Generate bracket from participants
    function generateBracket(participants: TournamentParticipant[]): TournamentParticipant[][] {
      const participantRounds: TournamentParticipant[][] = [];
      let currentRound = participants.slice();
      while (currentRound.length > 1) {
        participantRounds.push(currentRound);
        const nextRound: TournamentParticipant[] = [];
        for (let i = 0; i < currentRound.length; i += 2) {
          nextRound.push({
            id: `winner-${participantRounds.length}-${i/2}`,
            username: 'TBD',
            status: 'pending',
          } as unknown as TournamentParticipant);
        }
        currentRound = nextRound;
      }
      if (currentRound.length === 1) {
        participantRounds.push(currentRound);
      }
      return participantRounds;
    }

    const participantRounds = generateBracket(bracket.participants);
    
    return (
      <Box>
        <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents sx={{ color: '#00ff9d' }} />
          Single Elimination Bracket
        </Typography>
      </Box>
    );
  }

  // Group matches by round for grid view
  const matchRounds = bracket.rounds.flatMap(r => r.matches).reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  const roundNames = ['Quarter Finals', 'Semi Finals', 'Finals', 'Championship'];

  if (bracket.rounds && bracket.rounds.flatMap(r => r.matches).length > 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents sx={{ color: '#00ff9d' }} />
          Tournament Bracket
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(matchRounds).map(([round, matches], index) => (
            <Grid item key={round} xs={12} md={6} lg={4}>
              <Card sx={cyberCardStyle}>
                <Typography variant="h6" align="center" sx={{ 
                  ...neonTextStyle,
                  fontSize: '1.1rem',
                  mb: 2,
                  color: index === Object.keys(matchRounds).length - 1 ? '#ffff00' : '#00a8ff'
                }}>
                  {index === Object.keys(matchRounds).length - 1 ? '🏆 FINAL' : `ROUND ${index + 1}`}
                </Typography>
                {matches.map((match) => (
                  <Box key={match.id} sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid rgba(0, 255, 157, 0.3)', 
                    borderRadius: 2,
                    background: 'rgba(0, 255, 157, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(0, 255, 157, 0.6)',
                      background: 'rgba(0, 255, 157, 0.1)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ 
                        fontWeight: 'bold',
                        color: '#fff',
                        textShadow: '0 0 5px rgba(0, 255, 157, 0.5)',
                        fontSize: '0.9rem'
                      }}>
                        {match.participant1?.username || 'TBD'} vs {match.participant2?.username || 'TBD'}
                      </Typography>
                      <Chip 
                        label={match.status} 
                        size="small" 
                        sx={getMatchStatusChipStyle(match.status)}
                      />
                    </Box>
                    
                    {match.score && (
                      <Typography variant="caption" sx={{ 
                        color: '#00ff9d',
                        display: 'block',
                        mb: 1,
                        fontWeight: 'bold'
                      }}>
                        Score: {match.score}
                      </Typography>
                    )}
                    
                    {match.winner && (
                      <Typography variant="caption" sx={{ 
                        color: '#ffff00',
                        display: 'block',
                        mb: 1,
                        fontWeight: 'bold',
                        textShadow: '0 0 5px #ffff00'
                      }}>
                        Winner: {match.winner.username}
                      </Typography>
                    )}
                    
                    {(match.status === 'pending' || match.status === 'in_progress') && (
                      <Box sx={{ mt: 1 }}>
                        <button 
                          onClick={() => onReportResult && onReportResult(match)}
                          style={cyberButtonStyle}
                        >
                          Report Result
                        </button>
                      </Box>
                    )}
                  </Box>
                ))}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Fallback: participant-based bracket (legacy)
  if (!bracket.participants || bracket.participants.length < 2) {
    return (
      <Card sx={cyberCardStyle}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SportsEsports sx={{ fontSize: '3rem', color: '#00ff9d', mb: 2 }} />
          <Typography sx={{ color: '#888', fontSize: '1.1rem', mb: 1 }}>
            Bracket Generation Pending
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
            Bracket will be generated when enough participants have registered.
          </Typography>
        </Box>
      </Card>
    );
  }

  // Generate bracket from participants
  function generateBracket(participants: TournamentParticipant[]): TournamentParticipant[][] {
    const rounds: TournamentParticipant[][] = [];
    let currentRound = participants.slice();
    while (currentRound.length > 1) {
      rounds.push(currentRound);
      const nextRound: TournamentParticipant[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        nextRound.push({
          id: `winner-${rounds.length}-${i/2}`,
          username: 'TBD',
          status: 'pending',
        } as TournamentParticipant);
      }
      currentRound = nextRound;
    }
    if (currentRound.length === 1) {
      rounds.push(currentRound);
    }
    return rounds;
  }

  const rounds = generateBracket(bracket.participants);
  
  return (
    <Box>
      <Typography variant="h5" sx={{ ...neonTextStyle, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEvents sx={{ color: '#00ff9d' }} />
        Single Elimination Bracket
      </Typography>
      <Grid container spacing={3}>
        {rounds.map((round, roundIdx) => (
          <Grid item key={roundIdx} xs={12} md={6} lg={4}>
            <Card sx={cyberCardStyle}>
              <Typography variant="h6" align="center" sx={{ 
                ...neonTextStyle,
                fontSize: '1.1rem',
                mb: 2,
                color: roundIdx === 0 ? '#00ff9d' : roundIdx === rounds.length - 1 ? '#ffff00' : '#00a8ff'
              }}>
                {roundIdx === 0
                  ? 'ROUND 1'
                  : roundIdx === rounds.length - 1
                  ? '🏆 FINAL'
                  : `ROUND ${roundIdx + 1}`}
              </Typography>
              {round.map((p, matchIdx) => {
                if (roundIdx === 0) {
                  const p2 = round[matchIdx + 1];
                  if (matchIdx % 2 === 0) {
                    return (
                      <Box key={p.id} sx={{ 
                        mb: 2,
                        p: 2,
                        border: '1px solid rgba(0, 255, 157, 0.3)',
                        borderRadius: 2,
                        background: 'rgba(0, 255, 157, 0.05)',
                        textAlign: 'center'
                      }}>
                        <Typography sx={{ 
                          color: '#fff',
                          fontWeight: 'bold',
                          textShadow: '0 0 5px rgba(0, 255, 157, 0.5)',
                          mb: 1
                        }}>
                          {p.username || 'TBD'}
                        </Typography>
                        <Typography sx={{ 
                          color: '#00ff9d',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          mb: 1
                        }}>
                          VS
                        </Typography>
                        <Typography sx={{ 
                          color: '#fff',
                          fontWeight: 'bold',
                          textShadow: '0 0 5px rgba(0, 255, 157, 0.5)'
                        }}>
                          {p2?.username || 'TBD'}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                } else {
                  return (
                    <Box key={p.id} sx={{ 
                      mb: 2,
                      p: 2,
                      border: '1px solid rgba(0, 168, 255, 0.3)',
                      borderRadius: 2,
                      background: 'rgba(0, 168, 255, 0.05)',
                      textAlign: 'center'
                    }}>
                      <Typography sx={{ 
                        color: '#fff',
                        fontWeight: 'bold',
                        textShadow: '0 0 5px rgba(0, 168, 255, 0.5)'
                      }}>
                        {p.username || 'TBD'}
                      </Typography>
                    </Box>
                  );
                }
              })}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TournamentBracket;
