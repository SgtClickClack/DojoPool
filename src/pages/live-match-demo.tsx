import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import LiveMatchInterface from '../components/Game/LiveMatchInterface';

const LiveMatchDemo: React.FC = () => {
  const [matchId, setMatchId] = useState('demo-match-123');
  const [playerId, setPlayerId] = useState('demo-player-456');
  const [playerName, setPlayerName] = useState('Demo Player');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [matchStatus, setMatchStatus] = useState<
    'active' | 'paused' | 'finished'
  >('active');
  const [showInterface, setShowInterface] = useState(false);

  const handleStartDemo = () => {
    if (matchId && playerId && playerName) {
      setShowInterface(true);
    }
  };

  const handleResetDemo = () => {
    setShowInterface(false);
    setMatchId('demo-match-123');
    setPlayerId('demo-player-456');
    setPlayerName('Demo Player');
    setIsPlayerTurn(true);
    setMatchStatus('active');
  };

  if (showInterface) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4" sx={{ color: '#00d4ff' }}>
            Live Match Demo
          </Typography>
          <Button
            variant="outlined"
            onClick={handleResetDemo}
            sx={{ color: '#00d4ff', borderColor: '#00d4ff' }}
          >
            Reset Demo
          </Button>
        </Box>

        <LiveMatchInterface
          matchId={matchId}
          playerId={playerId}
          playerName={playerName}
          isPlayerTurn={isPlayerTurn}
          matchStatus={matchStatus}
        />

        {/* Demo Controls */}
        <Paper
          sx={{
            p: 3,
            mt: 3,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
          }}
        >
          <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
            Demo Controls
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => setIsPlayerTurn(!isPlayerTurn)}
              sx={{
                color: isPlayerTurn ? '#4caf50' : '#ff9800',
                borderColor: isPlayerTurn ? '#4caf50' : '#ff9800',
              }}
            >
              {isPlayerTurn ? 'End Turn' : 'Start Turn'}
            </Button>

            <Button
              variant="outlined"
              onClick={() =>
                setMatchStatus(matchStatus === 'active' ? 'paused' : 'active')
              }
              sx={{
                color: matchStatus === 'active' ? '#ff9800' : '#4caf50',
                borderColor: matchStatus === 'active' ? '#ff9800' : '#4caf50',
              }}
            >
              {matchStatus === 'active' ? 'Pause Match' : 'Resume Match'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => setMatchStatus('finished')}
              sx={{ color: '#f44336', borderColor: '#f44336' }}
            >
              End Match
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography
          variant="h2"
          sx={{
            color: '#00d4ff',
            fontWeight: 'bold',
            textShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
            mb: 4,
          }}
        >
          Live Match Demo
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            mb: 6,
          }}
        >
          Experience the AI-powered live commentary and shot reporting system
        </Typography>

        <Paper
          sx={{
            p: 4,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '2px solid #00d4ff',
          }}
        >
          <Typography variant="h6" sx={{ color: '#00d4ff', mb: 3 }}>
            Configure Demo Match
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            <TextField
              label="Match ID"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              fullWidth
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
                },
              }}
            />

            <TextField
              label="Player ID"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              fullWidth
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
                },
              }}
            />

            <TextField
              label="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              fullWidth
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
                },
              }}
            />

            <Button
              variant="contained"
              onClick={handleStartDemo}
              disabled={!matchId || !playerId || !playerName}
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0099cc, #006699)',
                },
                '&:disabled': {
                  background: 'rgba(0, 212, 255, 0.3)',
                },
              }}
            >
              Start Live Match Demo
            </Button>
          </Box>
        </Paper>

        {/* Feature Overview */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h4" sx={{ color: '#00d4ff', mb: 3 }}>
            Features
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}
            >
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                🎯 Shot Reporting
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Quick buttons for common shot outcomes and custom reporting with
                detailed notes
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}
            >
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                🤖 AI Commentary
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Real-time AI-generated commentary for each shot with cyberpunk
                styling
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}
            >
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                🔌 WebSocket Integration
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Real-time communication with the backend MatchGateway for live
                updates
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}
            >
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                🎮 Interactive Controls
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Turn-based controls and match status management for realistic
                gameplay
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LiveMatchDemo;
