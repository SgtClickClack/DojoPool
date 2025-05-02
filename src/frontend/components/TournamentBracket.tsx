import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  useTheme,
} from '@mui/material';

interface Match {
  id: string;
  player1: string | null;
  player2: string | null;
  score1: number;
  score2: number;
  winner: string | null;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TournamentBracketProps {
  tournament: {
    id: string;
    name: string;
    type: 'single_elimination' | 'double_elimination' | 'round_robin';
    matches: Match[];
    registrationDeadline: string;
    status: 'pending' | 'in_progress' | 'completed';
  };
  onRegister?: () => void;
  onPayEntryFee?: () => void;
}

const MatchCard: React.FC<{
  match: Match;
  round: number;
  totalRounds: number;
}> = ({ match, round, totalRounds }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 2,
        borderLeft: `4px solid ${
          match.status === 'completed'
            ? theme.palette.success.main
            : match.status === 'in_progress'
            ? theme.palette.warning.main
            : theme.palette.grey[300]
        }`,
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Round {round} of {totalRounds}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body1">
              {match.player1 || 'TBD'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {match.score1}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">
              {match.player2 || 'TBD'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {match.score2}
            </Typography>
          </Grid>
        </Grid>
        {match.status === 'in_progress' && (
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onRegister,
  onPayEntryFee,
}) => {
  const theme = useTheme();
  const [matchesByRound, setMatchesByRound] = React.useState<{
    [key: string]: Match[];
  }>({});

  React.useEffect(() => {
    const groupedMatches = tournament.matches.reduce((acc, match) => {
      const round = match.id.split('-')[1];
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    }, {} as { [key: string]: Match[] });

    setMatchesByRound(groupedMatches);
  }, [tournament.matches]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tournament Bracket
      </Typography>
      {Object.entries(matchesByRound).map(([round, matches]) => (
        <React.Fragment key={round}>
          <Typography variant="subtitle1" gutterBottom>
            Round {round}
          </Typography>
          <Grid container spacing={2}>
            {matches.map((match) => (
              <Grid item xs={12} sm={6} md={4} key={match.id}>
                <MatchCard match={match} round={Number(round)} totalRounds={Object.keys(matchesByRound).length} />
              </Grid>
            ))}
          </Grid>
        </React.Fragment>
      ))}
      
      {onRegister && (
        <Button
          variant="contained"
          color="primary"
          onClick={onRegister}
          sx={{ mt: 3 }}
        >
          Register for Tournament
        </Button>
      )}

      {onPayEntryFee && (
        <Button
          variant="contained"
          color="secondary"
          onClick={onPayEntryFee}
          sx={{ mt: 3 }}
        >
          Pay Entry Fee
        </Button>
      )}
    </Box>
  );
};

export default TournamentBracket;
