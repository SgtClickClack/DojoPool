import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  SportsEsports,
  Timeline,
  School,
  Star,
  Warning,
  CheckCircle,
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Download,
  Share,
} from '@mui/icons-material';
import MatchAnalysisService, {
  MatchAnalysis,
  PlayerPerformance,
  TrainingProgram,
  KeyMoment,
} from '../../services/ai/MatchAnalysisService-Meex';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`match-analysis-tabpanel-${index}`}
      aria-labelledby={`match-analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MatchAnalysisComponent: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [trainingProgram, setTrainingProgram] = useState<TrainingProgram | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const analysisService = MatchAnalysisService.getInstance();

  useEffect(() => {
    // Load mock data on component mount
    loadMockAnalysis();
  }, []);

  const loadMockAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const analysis = await analysisService.analyzeMatch('mock_match_001');
      setMatchAnalysis(analysis);
      
      // Generate training program
      const program = await analysisService.generateTrainingProgram('player1', analysis.player1Performance);
      setTrainingProgram(program);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderPerformanceCard = (performance: PlayerPerformance, title: string) => (
    <Card
      sx={{
        background: 'rgba(20, 20, 20, 0.9)',
        border: '2px solid #00ff9d',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
        backdropFilter: 'blur(10px)',
        mb: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            color: '#00ff9d',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
            mb: 2,
            textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
          }}
        >
          {title}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
              Performance Metrics
            </Typography>
            {[
              { label: 'Accuracy', value: performance.accuracy, color: '#00ff9d' },
              { label: 'Speed', value: performance.speed, color: '#00a8ff' },
              { label: 'Consistency', value: performance.consistency, color: '#ff6b6b' },
              { label: 'Strategy', value: performance.strategy, color: '#feca57' },
              { label: 'Pressure Handling', value: performance.pressureHandling, color: '#ff9ff3' },
              { label: 'Shot Selection', value: performance.shotSelection, color: '#54a0ff' },
              { label: 'Positioning', value: performance.positioning, color: '#5f27cd' },
            ].map((metric) => (
              <Box key={metric.label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {metric.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: metric.color, fontWeight: 600 }}>
                    {metric.value}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: metric.color,
                      boxShadow: `0 0 10px ${metric.color}`,
                    },
                  }}
                />
              </Box>
            ))}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
              Overall Score
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h2"
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 700,
                  textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
                }}
              >
                {performance.overallScore}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                out of 100
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
              Strengths
            </Typography>
            <Box sx={{ mb: 2 }}>
              {performance.strengths.map((strength, index) => (
                <Chip
                  key={index}
                  icon={<CheckCircle />}
                  label={strength}
                  sx={{
                    backgroundColor: '#00ff9d',
                    color: '#000',
                    fontWeight: 600,
                    mr: 1,
                    mb: 1,
                  }}
                />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#ff6b6b', mb: 1 }}>
              Areas for Improvement
            </Typography>
            <Box>
              {performance.weaknesses.map((weakness, index) => (
                <Chip
                  key={index}
                  icon={<Warning />}
                  label={weakness}
                  sx={{
                    backgroundColor: '#ff6b6b',
                    color: '#fff',
                    fontWeight: 600,
                    mr: 1,
                    mb: 1,
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderKeyMoments = (moments: KeyMoment[]) => (
    <Card
      sx={{
        background: 'rgba(20, 20, 20, 0.9)',
        border: '2px solid #00a8ff',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            color: '#00a8ff',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
            mb: 2,
            textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
          }}
        >
          Key Moments
        </Typography>

        <List>
          {moments.map((moment, index) => (
            <React.Fragment key={index}>
              <ListItem
                sx={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  mb: 1,
                  border: `1px solid ${moment.impact === 'positive' ? '#00ff9d' : '#ff6b6b'}`,
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      backgroundColor: moment.impact === 'positive' ? '#00ff9d' : '#ff6b6b',
                      color: '#000',
                      width: 32,
                      height: 32,
                    }}
                  >
                    {moment.type === 'break' && <SportsEsports />}
                    {moment.type === 'safety' && <Psychology />}
                    {moment.type === 'clutch' && <Star />}
                    {moment.type === 'foul' && <Warning />}
                    {moment.type === 'mistake' && <TrendingDown />}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ color: '#fff', fontWeight: 600 }}>
                      {moment.description}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        {Math.floor(moment.timestamp / 60)}:{(moment.timestamp % 60).toString().padStart(2, '0')} - {moment.type.toUpperCase()}
                      </Typography>
                      {moment.recommendation && (
                        <Typography variant="body2" sx={{ color: '#00a8ff', mt: 1 }}>
                          💡 {moment.recommendation}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < moments.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderTrainingProgram = (program: TrainingProgram) => (
    <Card
      sx={{
        background: 'rgba(20, 20, 20, 0.9)',
        border: '2px solid #feca57',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#feca57',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              textShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
            }}
          >
            {program.name}
          </Typography>
          <Chip
            label={program.difficulty.toUpperCase()}
            sx={{
              backgroundColor: '#feca57',
              color: '#000',
              fontWeight: 600,
            }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: '#ccc', mb: 3 }}>
          {program.description}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
            Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={program.progress}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#feca57',
                boxShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
              },
            }}
          />
          <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
            {program.progress}% Complete
          </Typography>
        </Box>

        <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
          Focus Areas
        </Typography>
        <Box sx={{ mb: 3 }}>
          {program.focusAreas.map((area, index) => (
            <Chip
              key={index}
              label={area}
              sx={{
                backgroundColor: '#00a8ff',
                color: '#000',
                fontWeight: 600,
                mr: 1,
                mb: 1,
              }}
            />
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
          Exercises ({program.exercises.length})
        </Typography>
        <List>
          {program.exercises.map((exercise, index) => (
            <ListItem
              key={index}
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                mb: 1,
              }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    backgroundColor: '#00ff9d',
                    color: '#000',
                    width: 32,
                    height: 32,
                  }}
                >
                  {index + 1}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ color: '#fff', fontWeight: 600 }}>
                    {exercise.name}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      {exercise.description} - {exercise.duration} minutes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                      Focus: {exercise.focusArea}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  if (isAnalyzing) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            color: '#00ff9d',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            mb: 3,
            textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
          }}
        >
          AI Analysis in Progress
        </Typography>
        <LinearProgress
          variant="determinate"
          value={analysisProgress}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#00ff9d',
              boxShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
            },
          }}
        />
        <Typography variant="body1" sx={{ color: '#ccc', mt: 2 }}>
          {analysisProgress}% Complete
        </Typography>
      </Box>
    );
  }

  if (!matchAnalysis) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            color: '#00ff9d',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            mb: 3,
            textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
          }}
        >
          AI Match Analysis
        </Typography>
        <Button
          variant="contained"
          onClick={loadMockAnalysis}
          sx={{
            background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
            color: '#000',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
            px: 4,
            py: 2,
            borderRadius: 3,
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
            '&:hover': {
              background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
              boxShadow: '0 0 30px rgba(0, 168, 255, 0.5)',
            },
          }}
        >
          Start Analysis
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            color: '#00ff9d',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
          }}
        >
          AI Match Analysis
        </Typography>
        <Box>
          <Tooltip title="Refresh Analysis">
            <IconButton
              onClick={loadMockAnalysis}
              sx={{
                color: '#00ff9d',
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 157, 0.1)',
                },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Report">
            <IconButton
              sx={{
                color: '#00a8ff',
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 168, 255, 0.1)',
                },
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Analysis">
            <IconButton
              sx={{
                color: '#feca57',
                '&:hover': {
                  backgroundColor: 'rgba(254, 202, 87, 0.1)',
                },
              }}
            >
              <Share />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper
        sx={{
          background: 'rgba(20, 20, 20, 0.9)',
          border: '1px solid rgba(0, 255, 157, 0.3)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            background: 'rgba(30, 30, 30, 0.9)',
            borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
            '& .MuiTab-root': {
              color: '#fff',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              '&.Mui-selected': {
                color: '#00ff9d',
                textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00ff9d',
              boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
            },
          }}
        >
          <Tab label="Performance Analysis" />
          <Tab label="Key Moments" />
          <Tab label="Training Program" />
          <Tab label="Predictions" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderPerformanceCard(matchAnalysis.player1Performance, 'Player 1 Performance')}
            </Grid>
            <Grid item xs={12}>
              {renderPerformanceCard(matchAnalysis.player2Performance, 'Player 2 Performance')}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderKeyMoments(matchAnalysis.keyMoments)}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {trainingProgram && renderTrainingProgram(trainingProgram)}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Card
            sx={{
              background: 'rgba(20, 20, 20, 0.9)',
              border: '2px solid #ff9ff3',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(255, 159, 243, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  color: '#ff9ff3',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mb: 2,
                  textShadow: '0 0 10px rgba(255, 159, 243, 0.5)',
                }}
              >
                Next Match Predictions
              </Typography>

              <List>
                {matchAnalysis.nextMatchPredictions.map((prediction, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          backgroundColor: '#ff9ff3',
                          color: '#000',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {Math.round(prediction.winProbability)}%
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                          vs {prediction.opponentId}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Win Probability: {prediction.winProbability.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                            Predicted Score: {prediction.predictedScore}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#feca57' }}>
                            Strategy: {prediction.recommendedStrategy}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MatchAnalysisComponent; 