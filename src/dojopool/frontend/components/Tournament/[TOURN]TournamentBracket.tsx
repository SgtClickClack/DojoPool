import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Tournament, TournamentMatch, TournamentParticipant } from '../../types/tournament';

const BracketContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflowX: 'auto',
  minWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  '& .round': {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    minWidth: 250,
    margin: theme.spacing(0, 2),
  },
}));

const MatchCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  transition: 'transform 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[4],
  },
}));

const PlayerChip = styled(Chip)<{ isWinner?: boolean }>(({ theme, isWinner }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: isWinner ? theme.palette.success.light : theme.palette.grey[200],
  color: isWinner ? theme.palette.success.contrastText : theme.palette.text.primary,
  '& .MuiChip-label': {
    fontWeight: isWinner ? 'bold' : 'normal',
  },
}));

interface TournamentBracketProps {
  tournament: Tournament;
  onMatchClick?: (match: TournamentMatch) => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onMatchClick,
}) => {
  const [rounds, setRounds] = useState<TournamentMatch[][]>([]);

  useEffect(() => {
    // Organize matches into rounds
    const roundsMap = new Map<number, TournamentMatch[]>();
    tournament.brackets.forEach((bracket) => {
      bracket.matches.forEach((match) => {
        const round = roundsMap.get(bracket.round_number) || [];
        round.push(match);
        roundsMap.set(bracket.round_number, round);
      });
    });

    // Convert map to array of rounds
    const sortedRounds = Array.from(roundsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, matches]) => matches);

    setRounds(sortedRounds);
  }, [tournament]);

  const getMatchStatus = (match: TournamentMatch) => {
    switch (match.status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" sx={{ ml: 1 }} />;
      case 'in_progress':
        return <Chip label="In Progress" color="primary" size="small" sx={{ ml: 1 }} />;
      case 'scheduled':
        return <Chip label="Scheduled" color="default" size="small" sx={{ ml: 1 }} />;
      default:
        return null;
    }
  };

  const renderMatch = (match: TournamentMatch) => (
    <MatchCard
      key={match.id}
      onClick={() => onMatchClick?.(match)}
      elevation={match.status === 'in_progress' ? 4 : 1}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Match #{match.id}
          {getMatchStatus(match)}
        </Typography>
      </Box>

      <Box>
        {match.players.map((player) => (
          <PlayerChip
            key={player.id}
            label={player.username}
            isWinner={player.id === match.winner_id}
          />
        ))}
      </Box>

      {match.score && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Score: {match.score}
        </Typography>
      )}

      {match.scheduled_time && (
        <Typography variant="caption" color="textSecondary" display="block">
          {new Date(match.scheduled_time).toLocaleString()}
        </Typography>
      )}
    </MatchCard>
  );

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Tournament Bracket
      </Typography>

      <BracketContainer>
        {rounds.map((roundMatches, index) => (
          <div key={index} className="round">
            <Typography variant="subtitle1" gutterBottom align="center">
              Round {index + 1}
            </Typography>
            {roundMatches.map(renderMatch)}
          </div>
        ))}
      </BracketContainer>
    </Box>
  );
};

export default TournamentBracket;
