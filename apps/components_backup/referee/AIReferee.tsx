import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import VideocamIcon from '@mui/icons-material/Videocam';
import AIRefereeService from '../../services/referee/AIRefereeService';
import useCameraFeed from '../../hooks/useCameraFeed';
import { io, type Socket } from 'socket.io-client';

// Styling constants
const cyberpunkPaper = {
  background: 'rgba(20, 20, 40, 0.95)',
  border: '1.5px solid #00fff7',
  boxShadow: '0 0 24px #00fff7, 0 0 8px #ff00ea',
  borderRadius: 10,
  color: '#fff',
  margin: '1rem 0',
  padding: '1.5rem',
};

const videoFeedStyle = {
  ...cyberpunkPaper,
  height: '400px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.8)',
  border: '2px solid #00fff7',
  boxShadow: '0 0 30px rgba(0, 255, 247, 0.5)',
};

const statusPanelStyle = {
  ...cyberpunkPaper,
  padding: '1rem',
  height: '100%',
};

const eventLogStyle = {
  ...cyberpunkPaper,
  padding: '1rem',
  height: '300px',
  overflowY: 'auto',
};

const buttonStyle = {
  margin: '0.5rem',
  fontWeight: 'bold',
  borderRadius: '8px',
  textTransform: 'none',
  padding: '0.5rem 1.5rem',
};

// Mock data for static placeholders
const mockEvents = [
  { id: 1, time: '14:32:05', message: 'Game started', severity: 'info' },
  {
    id: 2,
    time: '14:33:12',
    message: 'Player 1 shot detected',
    severity: 'info',
  },
  {
    id: 3,
    time: '14:34:27',
    message: 'Foul detected on black ball',
    severity: 'warning',
  },
  {
    id: 4,
    time: '14:35:41',
    message: 'Illegal ball movement detected',
    severity: 'error',
  },
  {
    id: 5,
    time: '14:36:18',
    message: 'Player 2 shot detected',
    severity: 'info',
  },
  {
    id: 6,
    time: '14:37:55',
    message: 'Ball in pocket detected: red',
    severity: 'info',
  },
  { id: 7, time: '14:38:22', message: 'Player turn changed', severity: 'info' },
];

// Define interface for CV result data
interface CVResult {
  user_id: string;
  ball_count: number;
  circles: Array<{
    x: number;
    y: number;
    radius: number;
  }>;
  timestamp: string;
  game_monitor_result?: any;
  status?: string;
  message?: string;
}

const AIReferee: React.FC = () => {
  const [status, setStatus] = useState<'Idle' | 'Monitoring' | 'Paused'>(
    'Idle'
  );
  const [events, setEvents] = useState(mockEvents);
  const [ballCount, setBallCount] = useState<number>(0);
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('');
  const [circles, setCircles] = useState<
    Array<{ x: number; y: number; radius: number }>
  >([]);
  const socketRef = useRef<Socket | null>(null);

  const {
    videoRef,
    canvasRef,
    stream,
    error,
    isLoading,
    isCapturing,
    startCamera,
    stopCamera,
    startFrameCapture,
    stopFrameCapture,
  } = useCameraFeed();

  // Add an effect to log the capturing state for debugging
  useEffect(() => {
    if (isCapturing) {
      console.log('Frame capturing started');
    } else {
      console.log('Frame capturing stopped');
    }
  }, [isCapturing]);

  // Set up Socket.IO connection and event listener for cv_result
  useEffect(() => {
    // Initialize socket connection
    const socketOptions = {
      transports: ['websocket'],
      autoConnect: true,
    };

    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL || '/socket.io',
      socketOptions
    );
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server for cv_result events');
    });

    // Add event listener for cv_result
    socket.on('cv_result', (data: CVResult) => {
      console.log('Received cv_result:', data);

      // Update state with the received data
      if (data.status === 'error') {
        // Handle error
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        setEvents((prev) => [
          {
            id: Date.now(),
            time: timeString,
            message: `Error: ${data.message || 'Unknown error in CV processing'}`,
            severity: 'error',
          },
          ...prev,
        ]);
        return;
      }

      // Update ball count and circles
      setBallCount(data.ball_count);
      setCircles(data.circles || []);

      // Set a mock confidence level based on the number of balls detected
      // In a real application, this would come from the backend
      const confidence = Math.min(85 + data.ball_count * 2, 99);
      setDetectionConfidence(confidence);

      // Update last analysis time
      setLastAnalysisTime(data.timestamp);

      // Add event to the log
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      setEvents((prev) => [
        {
          id: Date.now(),
          time: timeString,
          message: `Detected ${data.ball_count} balls in frame`,
          severity: 'info',
        },
        ...prev,
      ]);
    });

    // Clean up on unmount
    return () => {
      socket.off('cv_result');
      socket.disconnect();
    };
  }, []);

  const handleStartMonitoring = async () => {
    try {
      await startCamera();
      setStatus('Monitoring');

      // Start capturing frames
      startFrameCapture();

      // Add a new event to the log
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      setEvents((prev) => [
        ...prev,
        {
          id: Date.now(),
          time: timeString,
          message: 'Camera feed activated and frame analysis started',
          severity: 'info',
        },
      ]);
    } catch (err) {
      console.error('Failed to start monitoring:', err);
      // Add error event to the log
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      setEvents((prev) => [
        ...prev,
        {
          id: Date.now(),
          time: timeString,
          message: 'Failed to activate camera feed',
          severity: 'error',
        },
      ]);
    }
  };

  const handleStopMonitoring = () => {
    // Stop capturing frames
    stopFrameCapture();

    stopCamera();
    setStatus('Paused');

    // Add a new event to the log
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        time: timeString,
        message: 'Monitoring paused and frame analysis stopped',
        severity: 'info',
      },
    ]);
  };

  const handleResetGame = () => {
    // Stop frame capturing first
    stopFrameCapture();

    // Then stop the camera
    stopCamera();

    // Reset the UI state
    setStatus('Idle');
    setEvents(mockEvents.slice(0, 1)); // Keep only the "Game started" event

    // Add a new event to the log
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        time: timeString,
        message: 'Game reset, all monitoring systems stopped',
        severity: 'info',
      },
    ]);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '80vh', mt: 2 }}>
      {/* Hidden canvas for frame capturing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        data-testid="frame-capture-canvas"
      />

      <Paper sx={cyberpunkPaper}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#00fff7',
            mb: 3,
            letterSpacing: 2,
            textAlign: 'center',
          }}
        >
          AI Referee System
        </Typography>

        <Grid container spacing={3}>
          {/* Video Feed */}
          <Grid item xs={12} md={8}>
            <Paper sx={videoFeedStyle}>
              {isLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress sx={{ color: '#00fff7', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#00fff7' }}>
                    Initializing camera...
                  </Typography>
                </Box>
              ) : stream ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '320px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #00fff7',
                      boxShadow: '0 0 15px rgba(0, 255, 247, 0.5)',
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#00fff7', mt: 2 }}>
                    AI Referee is actively monitoring the game
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VideocamIcon
                    sx={{ fontSize: 80, color: '#00fff7', opacity: 0.7, mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ color: '#00fff7', textAlign: 'center' }}
                  >
                    Video Feed
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#aaa', textAlign: 'center', mt: 1 }}
                  >
                    {status === 'Idle'
                      ? 'Press "Start Monitoring" to activate the AI Referee'
                      : 'Monitoring paused'}
                  </Typography>
                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        mt: 2,
                        width: '90%',
                        backgroundColor: 'rgba(211, 47, 47, 0.2)',
                        color: '#ff5555',
                        border: '1px solid #ff5555',
                      }}
                    >
                      {error}
                    </Alert>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Status Panel */}
          <Grid item xs={12} md={4}>
            <Paper sx={statusPanelStyle}>
              <Typography
                variant="h6"
                sx={{
                  color: '#ff00ea',
                  mb: 2,
                  borderBottom: '1px solid #ff00ea',
                  pb: 1,
                }}
              >
                Status Panel
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                  Current State:
                </Typography>
                <Chip
                  label={status}
                  sx={{
                    bgcolor:
                      status === 'Monitoring'
                        ? '#00ff9d'
                        : status === 'Paused'
                          ? '#ffaa00'
                          : '#aaa',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    py: 2,
                    px: 1,
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                  Frame Analysis:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: isCapturing ? '#00ff9d' : '#aaa',
                      mr: 1,
                      boxShadow: isCapturing ? '0 0 8px #00ff9d' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <Typography variant="h6" sx={{ color: '#00fff7' }}>
                    {isCapturing ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                  Balls Detected:
                </Typography>
                <Typography variant="h6" sx={{ color: '#00fff7' }}>
                  {ballCount}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                  Detection Confidence:
                </Typography>
                <Typography variant="h6" sx={{ color: '#00fff7' }}>
                  {detectionConfidence}%
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                  Last Analysis:
                </Typography>
                <Typography variant="body1" sx={{ color: '#00fff7' }}>
                  {lastAnalysisTime
                    ? new Date(lastAnalysisTime).toLocaleTimeString('en-US', {
                        hour12: false,
                      })
                    : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                  Active Rules:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    label="8-Ball"
                    size="small"
                    sx={{ bgcolor: '#00fff7', color: '#222' }}
                  />
                  <Chip
                    label="Fouls"
                    size="small"
                    sx={{ bgcolor: '#00fff7', color: '#222' }}
                  />
                  <Chip
                    label="Scratches"
                    size="small"
                    sx={{ bgcolor: '#00fff7', color: '#222' }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                  System Health:
                </Typography>
                <Chip
                  label="Optimal"
                  sx={{ bgcolor: '#00ff9d', color: '#222' }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Event Log */}
          <Grid item xs={12}>
            <Paper sx={eventLogStyle}>
              <Typography
                variant="h6"
                sx={{
                  color: '#ff00ea',
                  mb: 2,
                  borderBottom: '1px solid #ff00ea',
                  pb: 1,
                }}
              >
                Event Log
              </Typography>
              <List dense>
                {events.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                              variant="body2"
                              sx={{ color: '#aaa', mr: 1 }}
                            >
                              {event.time}
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color:
                                  event.severity === 'error'
                                    ? '#ff5555'
                                    : event.severity === 'warning'
                                      ? '#ffaa00'
                                      : '#00fff7',
                              }}
                            >
                              {event.message}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < events.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(0, 255, 247, 0.2)' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Control Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartMonitoring}
                disabled={status === 'Monitoring'}
                sx={{
                  ...buttonStyle,
                  bgcolor: '#00ff9d',
                  color: '#222',
                  '&:hover': { bgcolor: '#00cc7d' },
                  '&.Mui-disabled': { bgcolor: '#004d2f', color: '#aaa' },
                }}
              >
                Start Monitoring
              </Button>

              <Button
                variant="contained"
                startIcon={<StopIcon />}
                onClick={handleStopMonitoring}
                disabled={status !== 'Monitoring'}
                sx={{
                  ...buttonStyle,
                  bgcolor: '#ffaa00',
                  color: '#222',
                  '&:hover': { bgcolor: '#cc8800' },
                  '&.Mui-disabled': { bgcolor: '#4d3300', color: '#aaa' },
                }}
              >
                Pause
              </Button>

              <Button
                variant="contained"
                startIcon={<RestartAltIcon />}
                onClick={handleResetGame}
                sx={{
                  ...buttonStyle,
                  bgcolor: '#ff00ea',
                  color: '#fff',
                  '&:hover': { bgcolor: '#cc00bb' },
                }}
              >
                Reset Game
              </Button>

              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                sx={{
                  ...buttonStyle,
                  borderColor: '#00fff7',
                  color: '#00fff7',
                  '&:hover': {
                    borderColor: '#00cccc',
                    color: '#00cccc',
                    bgcolor: 'rgba(0, 255, 247, 0.1)',
                  },
                }}
              >
                Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AIReferee;
