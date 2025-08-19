import React from 'react';
import Layout from '../components/layout/Layout';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  Mic,
  MicOff,
  RecordVoiceOver,
  Hearing,
  Psychology,
  CheckCircle,
  Error,
} from '@mui/icons-material';

const VoiceAssistantPage: React.FC = () => {
  const [isListening, setIsListening] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(true);
  const [transcript, setTranscript] = React.useState('');
  const [commands, setCommands] = React.useState<string[]>([]);

  const handleToggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        const mockCommands = [
          'start game',
          'show score',
          'take shot',
          'pause game',
          'go to dashboard',
        ];
        const randomCommand =
          mockCommands[Math.floor(Math.random() * mockCommands.length)];
        setTranscript(randomCommand);
        setCommands((prev) => [...prev, randomCommand]);
        setIsListening(false);
      }, 2000);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'error';
    if (isListening) return 'success';
    return 'default';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isListening) return 'Listening...';
    return 'Ready';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              AI Voice Assistant
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Hands-free game control and voice-activated features powered by
              advanced natural language processing.
            </p>
          </div>

          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', mb: 6 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: '#00ff9d',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <RecordVoiceOver sx={{ mr: 2 }} />
                  Voice Control System
                </Typography>
                <Chip
                  label={getStatusText()}
                  color={getStatusColor()}
                  icon={isListening ? <Hearing /> : <Psychology />}
                />
              </Box>

              <Alert
                severity={isConnected ? 'success' : 'error'}
                sx={{ mb: 4 }}
                icon={isConnected ? <CheckCircle /> : <Error />}
              >
                {isConnected
                  ? 'Voice assistant is ready for commands'
                  : 'Voice assistant is not available'}
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <IconButton
                  onClick={handleToggleListening}
                  disabled={!isConnected}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: isListening ? '#00ff9d' : '#333',
                    color: isListening ? '#000' : '#00ff9d',
                    border: '3px solid #00ff9d',
                    '&:hover': {
                      bgcolor: isListening ? '#00cc7a' : '#444',
                    },
                  }}
                >
                  {isListening ? (
                    <MicOff sx={{ fontSize: 40 }} />
                  ) : (
                    <Mic sx={{ fontSize: 40 }} />
                  )}
                </IconButton>
              </Box>

              {transcript && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                    You said:
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: '#333' }}>
                    <Typography
                      variant="h5"
                      sx={{ color: '#fff', fontStyle: 'italic' }}
                    >
                      "{transcript}"
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                    Available Commands
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: '#333' }}>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Chip
                        label="Start game"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Pause game"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="End game"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Take shot"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Show score"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Show statistics"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Go to dashboard"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Open tournaments"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Find venue"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                      <Chip
                        label="Send message"
                        sx={{ bgcolor: '#00ff9d', color: '#000' }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                    Recent Commands
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: '#333', minHeight: 200 }}>
                    {commands.length > 0 ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {commands
                          .slice(-5)
                          .reverse()
                          .map((cmd, index) => (
                            <Chip
                              key={index}
                              label={cmd}
                              sx={{ bgcolor: '#555', color: '#fff' }}
                              icon={<RecordVoiceOver />}
                            />
                          ))}
                      </Box>
                    ) : (
                      <Typography
                        sx={{ color: '#888', textAlign: 'center', mt: 4 }}
                      >
                        No commands yet. Click the microphone to start!
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    Natural Language Processing
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    Advanced NLP algorithms understand context and intent from
                    natural speech, allowing for conversational interactions
                    with the gaming system.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    Hands-Free Control
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    Control games, navigate menus, and access information
                    without touching the screen. Perfect for when your hands are
                    busy or for accessibility.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                    Multi-Language Support
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    Support for multiple languages and accents, making the voice
                    assistant accessible to players from around the world.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>
      </div>
    </Layout>
  );
};

export default VoiceAssistantPage;
