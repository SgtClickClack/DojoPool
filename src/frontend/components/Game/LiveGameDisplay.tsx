import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { GameTable, BallState } from '../../../core/game/GameState'; // Adjust path as necessary

interface LiveGameDisplayProps {
  gameTable: GameTable | null;
}

// Simple component to visualize a ball
const Ball = ({ ball }: { ball: BallState }) => {
  const getBallColor = (num: number): string => {
    if (num === 0) return 'white';
    if (num === 8) return 'black';
    if (num >= 1 && num <= 7) return '#ff5722'; // Example solid color (orange)
    if (num >= 9 && num <= 15) return '#2196f3'; // Example stripe color (blue)
    return 'grey'; // Should not happen
  };

  // Basic scaling for display - adjust as needed
  const scale = 50;
  const radius = ball.radius * scale;

  if (ball.pocketed) {
      return null; // Don't render pocketed balls on the table
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${ball.position.x * scale - radius}px`,
        top: `${ball.position.y * scale - radius}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderRadius: '50%',
        backgroundColor: getBallColor(ball.number),
        border: ball.number === 0 ? '1px solid grey' : (ball.number > 8 ? '2px dashed white' : 'none'), // Simple stripe indication
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: ball.number === 8 ? 'white' : 'black',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        boxShadow: '1px 1px 3px rgba(0,0,0,0.5)',
      }}
    >
      {ball.number > 0 ? ball.number : ''}
    </Box>
  );
};

const LiveGameDisplay: React.FC<LiveGameDisplayProps> = ({ gameTable }) => {
  if (!gameTable) {
    return <Typography>Waiting for game data...</Typography>;
  }

  const { 
      id, 
      players, 
      currentTurn, 
      status, 
      balls, 
      pocketedBalls, 
      fouls, 
      playerBallTypes, 
      ballInHand, 
      tableWidth, 
      tableHeight 
  } = gameTable;

  const scale = 50; // Same scale as Ball component

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>Live Game: {id}</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          {/* Table Visualization */}
          <Box 
            sx={{
              position: 'relative',
              width: tableWidth * scale,
              height: tableHeight * scale,
              backgroundColor: 'green', // Pool table color
              border: '10px solid brown',
              borderRadius: '5px',
              margin: 'auto',
              overflow: 'hidden', // Hide balls outside bounds
            }}
          >
            {balls.map((ball) => (
              <Ball key={ball.number} ball={ball} />
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          {/* Game Info Panel */}
          <Box>
            <Typography variant="subtitle1">Status: {status}</Typography>
            <Typography variant="subtitle1">Current Turn: {players[currentTurn || '']?.name || 'N/A'}</Typography>
            {ballInHand && <Chip label="Ball in Hand" color="warning" size="small" sx={{ mt: 1 }} />}
            
            <Box mt={2}>
              <Typography variant="subtitle2">Scores:</Typography>
              {Object.values(players).map(p => (
                <Typography key={p.id}>{p.name}: {p.score} {playerBallTypes[p.id] !== 'open' ? `(${playerBallTypes[p.id]})` : ''}</Typography>
              ))}
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2">Fouls:</Typography>
              {Object.entries(fouls).map(([playerId, count]) => (
                <Typography key={playerId}>{players[playerId]?.name}: {count}</Typography>
              ))}
              {Object.keys(fouls).length === 0 && <Typography variant="body2" color="text.secondary">None</Typography>}
            </Box>

             <Box mt={2}>
              <Typography variant="subtitle2">Pocketed:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {pocketedBalls.sort((a, b) => a - b).map(num => (
                  <Chip key={num} label={num} size="small" 
                        color={getBallType(num) === 'solid' ? 'error' : (getBallType(num) === 'stripe' ? 'info' : (getBallType(num) === 'eight' ? 'default' : 'secondary'))} />
                ))}
                {pocketedBalls.length === 0 && <Typography variant="body2" color="text.secondary">None</Typography>}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Helper function (duplicate from AIRefereeService for now)
const getBallType = (num: number): string => {
    if (num === 0) return 'cue';
    if (num === 8) return 'eight';
    if (num >= 1 && num <= 7) return 'solid';
    if (num >= 9 && num <= 15) return 'stripe';
    return 'invalid';
};

export default LiveGameDisplay; 