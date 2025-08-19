import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { type Tournament, type TournamentMatch } from '../../types/tournament';

interface TournamentBracketProps {
  tournament: Tournament;
}

interface MatchBoxProps {
  match: TournamentMatch;
  players: Record<string, { name: string }>;
}

const MatchBox: React.FC<MatchBoxProps> = ({ match, players }) => {
  const player1 = match.player1Id ? players[match.player1Id] : null;
  const player2 = match.player2Id ? players[match.player2Id] : null;

  return (
    <Paper
      sx={{
        p: 1,
        width: 200,
        mb: 2,
        backgroundColor:
          match.status === 'COMPLETED' ? 'action.hover' : 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 0.5,
          backgroundColor:
            match.player1Id === match.winnerId
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
            match.player2Id === match.winnerId
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
  const playerLookup = tournament.players.reduce(
    (acc, player) => {
      acc[player.id] = { name: player.name };
      return acc;
    },
    {} as Record<string, { name: string }>
  );

  // Group matches by round (for single/double elim)
  const matchesByRound =
    tournament.rounds?.reduce(
      (acc, round) => {
        acc[round.roundNumber] = round.matches;
        return acc;
      },
      {} as Record<number, TournamentMatch[]>
    ) || {};

  // Group loser bracket matches by round (for double elim)
  const loserMatchesByRound =
    tournament.loserRounds?.reduce(
      (acc, round) => {
        acc[round.roundNumber] = round.matches;
        return acc;
      },
      {} as Record<number, TournamentMatch[]>
    ) || {};

  // For round robin: flatten all matches
  const allGroupMatches = tournament.groupMatches || [];

  // For Swiss: group by round
  const swissRounds = tournament.swissRounds || [];

  // Render logic by format
  switch (tournament.format) {
    case 'DOUBLE_ELIMINATION':
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
              {Object.entries(matchesByRound).map(([roundNumber, matches]) => (
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
              ))}
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
    case 'ROUND_ROBIN':
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Round Robin Standings
          </Typography>
          <Paper sx={{ overflowX: 'auto', p: 2 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Player</th>
                  {tournament.players.map((p) => (
                    <th key={p.id}>{p.name}</th>
                  ))}
                  <th>Wins</th>
                  <th>Losses</th>
                </tr>
              </thead>
              <tbody>
                {tournament.players.map((p1) => (
                  <tr key={p1.id}>
                    <td>{p1.name}</td>
                    {tournament.players.map((p2) => {
                      if (p1.id === p2.id) return <td key={p2.id}>-</td>;
                      const match = allGroupMatches.find(
                        (m) =>
                          (m.player1Id === p1.id && m.player2Id === p2.id) ||
                          (m.player1Id === p2.id && m.player2Id === p1.id)
                      );
                      return (
                        <td key={p2.id} style={{ textAlign: 'center' }}>
                          {match
                            ? match.status === 'COMPLETED'
                              ? `${match.score?.player1 || 0} - ${match.score?.player2 || 0}`
                              : 'In Progress'
                            : ''}
                        </td>
                      );
                    })}
                    <td>{p1.wins ?? '-'}</td>
                    <td>{p1.losses ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </Box>
      );
    case 'SWISS':
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
            {Object.entries(matchesByRound).map(([roundNumber, matches]) => (
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
                    {match.status !== 'COMPLETED' && (
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
            ))}
          </Box>
        </Box>
      );
  }
};

export default TournamentBracket;
