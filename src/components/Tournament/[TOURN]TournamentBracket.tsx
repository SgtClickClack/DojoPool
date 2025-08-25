import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import type {
  Tournament,
  TournamentMatch,
} from '../../types/[TOURN]tournament';

interface TournamentBracketProps {
  tournament: Tournament;
}

interface MatchBoxProps {
  match: TournamentMatch;
  players: Record<string, { name: string }>;
}

const MatchBox: React.FC<MatchBoxProps> = ({ match, players }) => {
  const player1 = match.player1_id ? players[match.player1_id] : null;
  const player2 = match.player2_id ? players[match.player2_id] : null;

  return (
    <Paper
      sx={{
        p: 1,
        width: 200,
        mb: 2,
        backgroundColor:
          match.status === 'completed' ? 'action.hover' : 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 0.5,
          backgroundColor:
            match.player1_id === match.winner_id
              ? 'success.light'
              : 'background.paper',
        }}
      >
        <Typography variant="body2">
          {player1 ? player1.name : 'TBD'}
        </Typography>
        <Typography variant="body2">{match.score?.player1 || 0}</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 0.5,
          backgroundColor:
            match.player2_id === match.winner_id
              ? 'success.light'
              : 'background.paper',
        }}
      >
        <Typography variant="body2">
          {player2 ? player2.name : 'TBD'}
        </Typography>
        <Typography variant="body2">{match.score?.player2 || 0}</Typography>
      </Box>
    </Paper>
  );
};

const TournamentBracket = (props: TournamentBracketProps) => {
  const { tournament } = props;

  // Create a lookup object for quick player access
  // Since the Tournament interface doesn't have players, we'll use bracket_data or create a placeholder
  const playerLookup: Record<string, { name: string }> = {};

  // Extract player data from bracket_data if available, or create placeholder data
  if ((tournament as any).bracket_data) {
    // Try to extract player information from bracket_data
    // This is a placeholder - the actual structure would depend on the bracket_data format
    Object.entries(
      (tournament as any).bracket_data as Record<string, any>
    ).forEach(([_key, value]) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value
      ) {
        playerLookup[value.id] = { name: value.name };
      }
    });
  }

  // Since the Tournament interface doesn't have these properties, we'll create placeholder data
  const matchesByRound: Record<number, TournamentMatch[]> = {};
  const loserMatchesByRound: Record<number, TournamentMatch[]> = {};
  const _allGroupMatches: TournamentMatch[] = [];
  const swissRounds: Array<{
    roundNumber: number;
    matches: TournamentMatch[];
  }> = [];

  // Render logic by format
  switch (tournament.format as any) {
    case 'double_elimination':
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Double Elimination Bracket
          </Typography>
          <Box sx={{ display: 'flex', gap: 6, overflowX: 'auto', p: 2 }}>
            {/* Winner Bracket */}
            <Box>
              <Typography variant="subtitle1" align="center">
                Winners Bracket
              </Typography>
              {Object.entries(matchesByRound).map(
                ([roundNumber, matches], _key) => (
                  <Box key={roundNumber} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      Round {roundNumber}
                    </Typography>
                    {matches.map((match) => (
                      <MatchBox
                        key={match.id}
                        match={match}
                        players={playerLookup}
                      />
                    ))}
                  </Box>
                )
              )}
            </Box>
            {/* Loser Bracket */}
            <Box>
              <Typography variant="subtitle1" align="center">
                Losers Bracket
              </Typography>
              {Object.entries(loserMatchesByRound).map(
                ([roundNumber, matches]) => (
                  <Box key={roundNumber} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      Round {roundNumber}
                    </Typography>
                    {matches.map((match) => (
                      <MatchBox
                        key={match.id}
                        match={match}
                        players={playerLookup}
                      />
                    ))}
                  </Box>
                )
              )}
            </Box>
          </Box>
        </Box>
      );
    case 'round_robin':
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Round Robin Standings
          </Typography>
          <Paper sx={{ overflowX: 'auto', p: 2 }}>
            <table className="bracket-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tournament data not available</td>
                  <td>No players loaded</td>
                </tr>
              </tbody>
            </table>
          </Paper>
        </Box>
      );
    case 'swiss':
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Swiss System Rounds
          </Typography>
          {swissRounds.map((round, idx) => (
            <Box key={round.roundNumber || idx} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                Round {round.roundNumber}
              </Typography>
              {round.matches.map((match: TournamentMatch) => (
                <MatchBox key={match.id} match={match} players={playerLookup} />
              ))}
            </Box>
          ))}
        </Box>
      );
    default:
      // Single Elimination or fallback
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Tournament Bracket
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 4,
              overflowX: 'auto',
              p: 2,
            }}
          >
            {Object.entries(matchesByRound).map(
              ([roundNumber, matches], _key) => (
                <Box
                  key={roundNumber}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Typography variant="subtitle1" align="center">
                    Round {roundNumber}
                  </Typography>
                  {matches.map((match) => (
                    <Box
                      key={match.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <MatchBox match={match} players={playerLookup} />
                      {match.status !== 'completed' && (
                        <Box
                          sx={{
                            width: 20,
                            height: 2,
                            backgroundColor: 'divider',
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              )
            )}
          </Box>
        </Box>
      );
  }
};

export default TournamentBracket;
