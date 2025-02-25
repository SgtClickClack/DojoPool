/** @jsxImportSource react */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  PhotoCamera,
  Videocam,
  BarChart,
  Check,
  Error,
  Help,
  Info,
  Refresh,
  BubbleChart,
  ZoomIn,
  ZoomOut,
  Speed,
  RotateLeft,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';

const AnalyzerContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  overflow: 'hidden',
}));

const MetricsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MetricCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const VideoPreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
}));

const Input = styled('input')({
  display: 'none',
});

const TabPanel = (props: { children?: React.ReactNode; value: number; index: number }) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shot-analysis-tabpanel-${index}`}
      aria-labelledby={`shot-analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface ShotMetrics {
  velocity: number;
  spin: number;
  accuracy: number;
  difficulty: number;
  anglePrecision: number;
  powerControl: number;
  shotType: string;
}

interface FrameData {
  timestamp: number;
  ballPositions: { x: number, y: number }[];
  stickPosition: { x: number, y: number, angle: number };
  prediction?: { x: number, y: number };
}

interface ShotAnalysis {
  success: boolean;
  error?: string;
  metrics?: ShotMetrics;
  recommendations?: string[];
  summary?: string;
  frames?: FrameData[];
  score?: number;
}

export const ShotAnalyzer: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<ShotAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear analysis when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [videoUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    
    // Create object URL for video preview
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    const formData = new FormData();
    formData.append('shot_video', file);

    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setAnalysis(null);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = Math.min(prevProgress + 5, 90);
          return newProgress;
        });
      }, 300);

      const response = await axios.post('/api/ai/analyze-shot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Delay to show 100% progress
      timeoutRef.current = setTimeout(() => {
        setAnalysis(response.data);
        setLoading(false);
      }, 500);
      
    } catch (err) {
      setError('Failed to analyze shot. Please try again with a different video.');
      console.error('Error analyzing shot:', err);
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Draw shot trajectory when switching to visualization tab
    if (newValue === 1 && analysis?.frames && canvasRef.current) {
      drawTrajectory();
    }
  };

  const drawTrajectory = () => {
    if (!canvasRef.current || !analysis?.frames?.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Draw table outline
    ctx.strokeStyle = theme.palette.primary.main;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);
    
    // Draw pockets
    const pocketRadius = 10;
    const pockets = [
      { x: 20, y: 20 }, // Top left
      { x: canvasWidth / 2, y: 20 }, // Top center
      { x: canvasWidth - 20, y: 20 }, // Top right
      { x: 20, y: canvasHeight - 20 }, // Bottom left
      { x: canvasWidth / 2, y: canvasHeight - 20 }, // Bottom center
      { x: canvasWidth - 20, y: canvasHeight - 20 }, // Bottom right
    ];
    
    ctx.fillStyle = theme.palette.grey[800];
    pockets.forEach(pocket => {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocketRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw ball trajectories from frames
    if (analysis.frames.length > 0) {
      const firstFrame = analysis.frames[0];
      const lastFrame = analysis.frames[analysis.frames.length - 1];
      
      // Draw cue ball trajectory
      ctx.strokeStyle = theme.palette.secondary.main;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const normalizeX = (x: number) => 20 + (x * (canvasWidth - 40));
      const normalizeY = (y: number) => 20 + (y * (canvasHeight - 40));
      
      // Start from cue ball position
      if (firstFrame.ballPositions.length > 0) {
        const startPos = firstFrame.ballPositions[0];
        ctx.moveTo(normalizeX(startPos.x), normalizeY(startPos.y));
        
        // Draw trajectory through all frames for cue ball
        analysis.frames.forEach(frame => {
          if (frame.ballPositions.length > 0) {
            ctx.lineTo(normalizeX(frame.ballPositions[0].x), normalizeY(frame.ballPositions[0].y));
          }
        });
        ctx.stroke();
        
        // Draw final position with larger circle
        if (lastFrame.ballPositions.length > 0) {
          const endPos = lastFrame.ballPositions[0];
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(normalizeX(endPos.x), normalizeY(endPos.y), 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = theme.palette.secondary.main;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      // Draw other balls (if any)
      if (firstFrame.ballPositions.length > 1) {
        for (let i = 1; i < firstFrame.ballPositions.length; i++) {
          const ballColor = i % 2 === 0 ? theme.palette.success.main : theme.palette.error.main;
          
          // Draw initial position
          ctx.fillStyle = ballColor;
          ctx.beginPath();
          ctx.arc(
            normalizeX(firstFrame.ballPositions[i].x),
            normalizeY(firstFrame.ballPositions[i].y),
            6, 0, 2 * Math.PI
          );
          ctx.fill();
          
          // Draw trajectory
          ctx.strokeStyle = ballColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(
            normalizeX(firstFrame.ballPositions[i].x),
            normalizeY(firstFrame.ballPositions[i].y)
          );
          
          // Connect positions through frames
          analysis.frames.forEach(frame => {
            if (frame.ballPositions.length > i) {
              ctx.lineTo(
                normalizeX(frame.ballPositions[i].x),
                normalizeY(frame.ballPositions[i].y)
              );
            }
          });
          ctx.stroke();
          
          // Draw final position
          if (lastFrame.ballPositions.length > i) {
            ctx.fillStyle = ballColor;
            ctx.beginPath();
            ctx.arc(
              normalizeX(lastFrame.ballPositions[i].x),
              normalizeY(lastFrame.ballPositions[i].y),
              6, 0, 2 * Math.PI
            );
            ctx.fill();
          }
        }
      }
      
      // Draw cue stick if available
      if (firstFrame.stickPosition) {
        const stickLength = 120;
        const angle = firstFrame.stickPosition.angle;
        const startX = normalizeX(firstFrame.stickPosition.x);
        const startY = normalizeY(firstFrame.stickPosition.y);
        const endX = startX + stickLength * Math.cos(angle);
        const endY = startY + stickLength * Math.sin(angle);
        
        ctx.strokeStyle = theme.palette.warning.main;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
  };

  const renderMetrics = (metrics: ShotMetrics) => (
    <MetricsContainer>
      <MetricCard>
        <Speed fontSize="large" color="primary" />
        <Typography variant="h6" gutterBottom>
          Velocity
        </Typography>
        <Typography variant="h4" color="primary">
          {metrics.velocity.toFixed(1)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          mph
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(metrics.velocity / 25 * 100, 100)} 
          sx={{ mt: 1 }}
        />
      </MetricCard>
      
      <MetricCard>
        <RotateLeft fontSize="large" color="primary" />
        <Typography variant="h6" gutterBottom>
          Spin
        </Typography>
        <Typography variant="h4" color="primary">
          {metrics.spin.toFixed(1)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          rpm
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(metrics.spin / 1000 * 100, 100)} 
          sx={{ mt: 1 }}
        />
      </MetricCard>
      
      <MetricCard>
        <TrendingUp fontSize="large" color="primary" />
        <Typography variant="h6" gutterBottom>
          Accuracy
        </Typography>
        <Typography variant="h4" color="primary">
          {(metrics.accuracy * 100).toFixed(1)}%
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={metrics.accuracy * 100} 
          sx={{ mt: 1 }}
          color={metrics.accuracy > 0.7 ? "success" : metrics.accuracy > 0.4 ? "warning" : "error"}
        />
      </MetricCard>
      
      <MetricCard>
        <BubbleChart fontSize="large" color="primary" />
        <Typography variant="h6" gutterBottom>
          Difficulty
        </Typography>
        <Typography variant="h4" color="primary">
          {metrics.difficulty.toFixed(1)}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          out of 10
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={metrics.difficulty * 10} 
          sx={{ mt: 1 }}
          color={metrics.difficulty < 4 ? "success" : metrics.difficulty < 7 ? "warning" : "error"}
        />
      </MetricCard>
    </MetricsContainer>
  );

  return (
    <AnalyzerContainer>
      <Typography variant="h5" gutterBottom>
        AI Shot Analysis
      </Typography>

      <Box display="flex" justifyContent="center" mb={3}>
        <label htmlFor="shot-video-upload">
          <Input
            accept="video/*"
            id="shot-video-upload"
            type="file"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <Button
            variant="contained"
            component="span"
            startIcon={<Videocam />}
            disabled={loading}
          >
            Upload Shot Video
          </Button>
        </label>
      </Box>

      {videoUrl && (
        <VideoPreview>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            width="100%"
            height="auto"
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
        </VideoPreview>
      )}

      {loading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="textSecondary">
              Analyzing shot...
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {analysis && !loading && (
        <>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<BarChart />} label="Metrics" />
            <Tab icon={<BubbleChart />} label="Visualization" />
            <Tab icon={<Info />} label="Recommendations" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            {analysis.metrics && (
              <>
                <Box sx={{ mb: 2, mt: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Shot Type: {analysis.metrics.shotType || 'Standard'}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {analysis.summary || 'This shot analysis identified key performance metrics to help improve your game.'}
                  </Typography>
                </Box>
                {renderMetrics(analysis.metrics)}
                {analysis.score !== undefined && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mt: 3,
                    }}
                  >
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        borderRadius: '50%',
                        width: 120,
                        height: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                      }}
                    >
                      <Typography variant="h4" align="center">
                        {analysis.score}
                      </Typography>
                      <Typography variant="caption" align="center">
                        OVERALL SCORE
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 400,
                backgroundColor: theme.palette.background.paper,
                borderRadius: theme.shape.borderRadius,
                overflow: 'hidden',
                boxShadow: theme.shadows[1],
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: theme.shape.borderRadius,
                  p: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setZoomLevel(Math.min(zoomLevel + 0.25, 2))}
                >
                  <ZoomIn />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setZoomLevel(Math.max(zoomLevel - 0.25, 0.5))}
                >
                  <ZoomOut />
                </IconButton>
              </Box>
              <canvas
                ref={canvasRef}
                width={640}
                height={400}
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={drawTrajectory}
              >
                Refresh Visualization
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <List>
                {analysis.recommendations.map((recommendation, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        {index % 3 === 0 ? (
                          <Check color="success" />
                        ) : index % 3 === 1 ? (
                          <Info color="primary" />
                        ) : (
                          <Help color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                    {index < analysis.recommendations.length - 1 && (
                      <Divider component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  No recommendations available for this shot.
                </Typography>
              </Box>
            )}
          </TabPanel>
        </>
      )}
    </AnalyzerContainer>
  );
};

export default ShotAnalyzer;