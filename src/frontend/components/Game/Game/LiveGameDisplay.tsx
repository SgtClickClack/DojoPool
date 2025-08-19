import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
// Remove GameTable/BallState imports as they are no longer directly used
// import { GameTable, BallState } from '../../../core/game/GameState';

// Import the new interface matching backend data
import { type BackendGameDetails } from '../../contexts/SocketContext'; // Adjust path if context moved

interface LiveGameDisplayProps {
  // Accept the backend details structure
  gameDetails: BackendGameDetails | null;
}

// Remove the Ball component as we don't have position data
/*
const Ball = ({ ball }: { ball: BallState }) => { ... };
*/

const LiveGameDisplay: React.FC<LiveGameDisplayProps> = ({ gameDetails }) => {
  if (!gameDetails) {
    // Keep the waiting message or provide a more specific one
    return <Typography>No live game details available.</Typography>;
  }

  // Destructure directly from BackendGameDetails
  const {
    id,
    player1, // Username
    player2, // Username
    status,
    score,
    winner,
    game_type,
    game_mode,
    // Missing: currentTurn, balls, pocketedBalls, fouls, ballInHand etc.
  } = gameDetails;

  // Basic player info based on usernames provided
  const playersInfo = [
    { id: 'p1', name: player1 },
    { id: 'p2', name: player2 },
  ];

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Live Game Info: {id}
      </Typography>
      <Grid container spacing={2} alignItems="flex-start">
        {/* Remove Table Visualization Grid Item */}
        {/* 
        <Grid item xs={12} md={8}>
           ... table viz ...
        </Grid> 
        */}

        {/* Make Info Panel take full width or adjust layout */}
        <Grid item xs={12}>
          <Box>
            <Typography variant="subtitle1">Status: {status}</Typography>
            <Typography variant="subtitle1">
              Type: {game_type} ({game_mode})
            </Typography>
            {/* Current turn is not available in BackendGameDetails */}
            {/* <Typography variant="subtitle1">Current Turn: ...</Typography> */}
            {/* Ball-in-hand is not available */}
            {/* {ballInHand && <Chip label="Ball in Hand" color="warning" size="small" sx={{ mt: 1 }} />} */}

            <Box mt={2}>
              <Typography variant="subtitle2">Players & Score:</Typography>
              <Typography>
                {player1} vs {player2}
              </Typography>
              <Typography>Score: {score || 'N/A'}</Typography>
              {winner && <Typography>Winner: {winner}</Typography>}
              {/* Player ball types are not available */}
            </Box>

            {/* Foul count is not available */}
            {/* 
            <Box mt={2}>
              <Typography variant="subtitle2">Fouls:</Typography>
              ...
            </Box> 
            */}

            {/* Pocketed balls list is not available */}
            {/* 
             <Box mt={2}>
              <Typography variant="subtitle2">Pocketed:</Typography>
               ...
            </Box> 
            */}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Remove duplicate getBallType helper
/*
const getBallType = (num: number): string => { ... };
*/

export default LiveGameDisplay;
