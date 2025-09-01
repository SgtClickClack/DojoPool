import GameSessionView from '@/components/GameSession/GameSessionView';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

const GameSessionDemo: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [showSession, setShowSession] = useState(false);
  const [demoSessionId, setDemoSessionId] =
    useState<string>('demo-session-123');

  const handleCreateDemoSession = async () => {
    // In a real app, this would call the API to create a session
    // For demo purposes, we'll use a mock session ID
    setDemoSessionId(`demo-session-${Date.now()}`);
    setShowSession(true);
  };

  const handleSessionEnd = (winnerId: string) => {
    console.log(`Game session ended with winner: ${winnerId}`);
    setShowSession(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Game Session Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the real-time game session system for pool games.
        Create a demo session to see the live game state management, shot
        tracking, and analytics in action.
      </Typography>

      {!showSession ? (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Start Demo Session
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Box>
                <TextField
                  fullWidth
                  label="Session ID (Optional)"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter custom session ID or leave empty for auto-generated"
                  helperText="Leave empty to use auto-generated demo session ID"
                />
              </Box>

              <Box>
                <Box display="flex" gap={2} alignItems="flex-end">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCreateDemoSession}
                    sx={{ minWidth: 200 }}
                  >
                    Create Demo Session
                  </Button>
                </Box>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Demo Features:</strong>
                <br />
                • Real-time game state management
                <br />
                • Shot and foul recording
                <br />
                • Live analytics and performance metrics
                <br />
                • Session pause/resume functionality
                <br />
                • Ball state tracking
                <br />• Player turn management
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5">
              Active Demo Session: {demoSessionId}
            </Typography>
            <Button variant="outlined" onClick={() => setShowSession(false)}>
              Close Demo
            </Button>
          </Box>

          <GameSessionView
            sessionId={demoSessionId}
            onSessionEnd={handleSessionEnd}
          />
        </Box>
      )}

      {/* Demo Instructions */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Use the Demo
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Session Management
              </Typography>
              <Typography variant="body2" paragraph>
                1. Click &quot;Create Demo Session&quot; to start
                <br />
                2. Use Pause/Resume to control session state
                <br />
                3. Click &quot;End Session&quot; to finish the demo
                <br />
                4. Monitor real-time updates every 5 seconds
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Game Actions
              </Typography>
              <Typography variant="body2" paragraph>
                1. &quot;Record Shot&quot; - Simulate a player taking a shot
                <br />
                2. &quot;Record Foul&quot; - Simulate a foul detection
                <br />
                3. &quot;Show Analytics&quot; - View performance metrics
                <br />
                4. Monitor ball states and player statistics
              </Typography>
            </Box>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This is a demo with mock data. In
              production, the system would integrate with real AI ball tracking,
              referee services, and live camera feeds for actual pool games.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default GameSessionDemo;
