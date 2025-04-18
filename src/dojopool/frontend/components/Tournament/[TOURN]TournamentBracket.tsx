import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { Tournament, TournamentMatch } from "../../types/tournament";

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
          match.status === "COMPLETED" ? "action.hover" : "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 0.5,
          backgroundColor:
            match.player1Id === match.winnerId
              ? "success.light"
              : "background.paper",
        }}
      >
        <Typography variant="body2">
          {player1 ? player1.name : "TBD"}
        </Typography>
        <Typography variant="body2">{match.score?.player1 || 0}</Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 0.5,
          backgroundColor:
            match.player2Id === match.winnerId
              ? "success.light"
              : "background.paper",
        }}
      >
        <Typography variant="body2">
          {player2 ? player2.name : "TBD"}
        </Typography>
        <Typography variant="body2">{match.score?.player2 || 0}</Typography>
      </Box>
    </Paper>
  );
};

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
}) => {
  // Create a lookup object for quick player access
  const playerLookup = tournament.players.reduce(
    (acc, player) => {
      acc[player.id] = { name: player.name };
      return acc;
    },
    {} as Record<string, { name: string }>,
  );

  // Group matches by round
  const matchesByRound = tournament.rounds.reduce(
    (acc, round) => {
      acc[round.roundNumber] = round.matches;
      return acc;
    },
    {} as Record<number, TournamentMatch[]>,
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tournament Bracket
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          p: 2,
        }}
      >
        {Object.entries(matchesByRound).map(([roundNumber, matches]) => (
          <Box
            key={roundNumber}
            sx={{
              display: "flex",
              flexDirection: "column",
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
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <MatchBox match={match} players={playerLookup} />
                {match.status !== "COMPLETED" && (
                  <Box
                    sx={{
                      width: 20,
                      height: 2,
                      backgroundColor: "divider",
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
};
