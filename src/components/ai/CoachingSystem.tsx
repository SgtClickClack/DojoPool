import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Rating,
} from '@mui/material';
import {
  School,
  TrendingUp,
  Psychology,
  SportsEsports,
  Timeline,
  Star,
  CheckCircle,
  PlayArrow,
  Pause,
  Stop,
  Add,
  Edit,
  Delete,
  Assessment,
  EmojiEvents,
  Speed,
  Accuracy,
  PsychologyAlt,
  FitnessCenter,
  Lightbulb,
} from '@mui/icons-material';
import MatchAnalysisService, {
  TrainingProgram,
  PlayerPerformance,
} from '../../services/ai/MatchAnalysisService';

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
      id={`coaching-tabpanel-${index}`}
      aria-labelledby={`coaching-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface CoachingSession {
  id: string;
  date: string;
  duration: number;
  focusArea: string;
  exercises: string[];
  performance: number;
  notes: string;
  coachRating: number;
}

interface SkillAssessment {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  exercises: string[];
}

const CoachingSystem: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [coachingSessions, setCoachingSessions] = useState<CoachingSession[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'session' | 'assessment' | 'program'>('session');

  const analysisService = MatchAnalysisService.getInstance();

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    // Generate mock training programs
    const mockPerformance: PlayerPerformance = {
      playerId: 'player1',
      matchId: 'mock_match_001',
      accuracy: 75,
      speed: 80,
      consistency: 70,
      strategy: 85,
      pressureHandling: 65,
      shotSelection: 75,
      positioning: 80,
      overallScore: 76,
      strengths: ['Strategy', 'Speed', 'Positioning'],
      weaknesses: ['Pressure Handling', 'Consistency'],
      recommendations: ['Practice under pressure', 'Improve consistency'],
    };

    const program1 = await analysisService.generateTrainingProgram('player1', mockPerformance);
    const program2 = await analysisService.generateTrainingProgram('player1', {
      ...mockPerformance,
      overallScore: 82,
    });

    setTrainingPrograms([program1, program2]);

    // Generate mock coaching sessions
    const sessions: CoachingSession[] = [
      {
        id: 'session_1',
        date: '2024-01-15',
        duration: 90,
        focusArea: 'Break Shot Consistency',
        exercises: ['Break Shot Drills', 'Cue Ball Control', 'Speed Control'],
        performance: 85,
        notes: 'Excellent progress on break shots. Need to work on cue ball positioning.',
        coachRating: 4,
      },
      {
        id: 'session_2',
        date: '2024-01-12',
        duration: 60,
        focusArea: 'Safety Play',
        exercises: ['Safety Shot Selection', 'Defensive Positioning', 'Tactical Play'],
        performance: 78,
        notes: 'Good understanding of safety concepts. More practice needed on execution.',
        coachRating: 3,
      },
    ];

    setCoachingSessions(sessions);

    // Generate mock skill assessments
    const assessments: SkillAssessment[] = [
      {
        skill: 'Break Shot',
        currentLevel: 7,
        targetLevel: 9,
        progress: 70,
        exercises: ['Break Shot Drills', 'Speed Control', 'Positioning'],
      },
      {
        skill: 'Safety Play',
        currentLevel: 6,
        targetLevel: 8,
        progress: 60,
        exercises: ['Safety Shot Selection', 'Defensive Positioning'],
      },
      {
        skill: 'Pressure Handling',
        currentLevel: 5,
        targetLevel: 8,
        progress: 50,
        exercises: ['Pressure Drills', 'Mental Game', 'Clutch Situations'],
      },
      {
        skill: 'Pattern Recognition',
        currentLevel: 8,
        targetLevel: 9,
        progress: 80,
        exercises: ['Pattern Drills', 'Game Analysis', 'Strategy Planning'],
      },
    ];

    setSkillAssessments(assessments);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const startCoachingSession = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setIsSessionActive(true);
    setSessionProgress(0);

    // Simulate session progress
    const progressInterval = setInterval(() => {
      setSessionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsSessionActive(false);
          return 100;
        }
        return prev + 5;
      });
    }, 1000);
  };

  const renderTrainingPrograms = () => (
    <Grid container spacing={3}>
      {trainingPrograms.map((program) => (
        <Grid item xs={12} md={6} key={program.programId}>
          <Card
            sx={{
              background: 'rgba(20, 20, 20, 0.9)',
              border: '2px solid #00ff9d',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
              backdropFilter: 'blur(10px)',
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00ff9d',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 600,
                    textShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                  }}
                >
                  {program.name}
                </Typography>
                <Chip
                  label={program.difficulty.toUpperCase()}
                  sx={{
                    backgroundColor: '#00ff9d',
                    color: '#000',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                {program.description}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
                  Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={program.progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#00ff9d',
                      boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
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
              <Box sx={{ mb: 2 }}>
                {program.focusAreas.map((area, index) => (
                  <Chip
                    key={index}
                    label={area}
                    size="small"
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

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => startCoachingSession(program)}
                  disabled={isSessionActive}
                  sx={{
                    background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                    color: '#000',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 600,
                    flex: 1,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                    },
                  }}
                >
                  Start Session
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  sx={{
                    borderColor: '#00a8ff',
                    color: '#00a8ff',
                    '&:hover': {
                      borderColor: '#00ff9d',
                      color: '#00ff9d',
                    },
                  }}
                >
                  Edit
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderCoachingSessions = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#00a8ff',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
            textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
          }}
        >
          Coaching Sessions
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setDialogType('session');
            setOpenDialog(true);
          }}
          sx={{
            background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
            color: '#000',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
          }}
        >
          New Session
        </Button>
      </Box>

      <List>
        {coachingSessions.map((session) => (
          <Card
            key={session.id}
            sx={{
              background: 'rgba(20, 20, 20, 0.9)',
              border: '2px solid #00a8ff',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              mb: 2,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#00a8ff',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {session.focusArea}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                    {session.date} • {session.duration} minutes
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 2 }}>
                    {session.notes}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#00ff9d', mb: 1 }}>
                      Performance
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={session.performance}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#00ff9d',
                          boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                      {session.performance}% Performance
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" sx={{ color: '#feca57', mb: 1 }}>
                    Exercises Completed
                  </Typography>
                  <Box>
                    {session.exercises.map((exercise, index) => (
                      <Chip
                        key={index}
                        label={exercise}
                        size="small"
                        icon={<CheckCircle />}
                        sx={{
                          backgroundColor: '#feca57',
                          color: '#000',
                          fontWeight: 600,
                          mr: 1,
                          mb: 1,
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'center', ml: 2 }}>
                  <Rating value={session.coachRating} readOnly />
                  <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                    Coach Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );

  const renderSkillAssessments = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#feca57',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
            textShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
          }}
        >
          Skill Assessments
        </Typography>
        <Button
          variant="contained"
          startIcon={<Assessment />}
          onClick={() => {
            setDialogType('assessment');
            setOpenDialog(true);
          }}
          sx={{
            background: 'linear-gradient(45deg, #feca57 0%, #ff6b6b 100%)',
            color: '#000',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 600,
          }}
        >
          New Assessment
        </Button>
      </Box>

      <Grid container spacing={3}>
        {skillAssessments.map((assessment) => (
          <Grid item xs={12} md={6} key={assessment.skill}>
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
                <Typography
                  variant="h6"
                  sx={{
                    color: '#feca57',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {assessment.skill}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Current Level
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#00ff9d', fontWeight: 700 }}>
                      {assessment.currentLevel}/10
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Target Level
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#00a8ff', fontWeight: 700 }}>
                      {assessment.targetLevel}/10
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#00ff9d', mb: 1 }}>
                    Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={assessment.progress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#feca57',
                        boxShadow: '0 0 10px rgba(254, 202, 87, 0.5)',
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                    {assessment.progress}% Complete
                  </Typography>
                </Box>

                <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
                  Recommended Exercises
                </Typography>
                <Box>
                  {assessment.exercises.map((exercise, index) => (
                    <Chip
                      key={index}
                      label={exercise}
                      size="small"
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderActiveSession = () => {
    if (!isSessionActive || !selectedProgram) return null;

    return (
      <Card
        sx={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '2px solid #00ff9d',
          borderRadius: 3,
          boxShadow: '0 0 50px rgba(0, 255, 157, 0.5)',
          backdropFilter: 'blur(20px)',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          minWidth: 400,
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            sx={{
              color: '#00ff9d',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              textAlign: 'center',
              mb: 3,
              textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
            }}
          >
            Active Coaching Session
          </Typography>

          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            {selectedProgram.name}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#00a8ff', mb: 1 }}>
              Session Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={sessionProgress}
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
            <Typography variant="body2" sx={{ color: '#ccc', mt: 1, textAlign: 'center' }}>
              {sessionProgress}% Complete
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Pause />}
              sx={{
                backgroundColor: '#feca57',
                color: '#000',
                fontWeight: 600,
                flex: 1,
              }}
            >
              Pause
            </Button>
            <Button
              variant="contained"
              startIcon={<Stop />}
              sx={{
                backgroundColor: '#ff6b6b',
                color: '#fff',
                fontWeight: 600,
                flex: 1,
              }}
            >
              End Session
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h3"
        sx={{
          color: '#00ff9d',
          fontFamily: 'Orbitron, monospace',
          fontWeight: 700,
          mb: 4,
          textAlign: 'center',
          textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
        }}
      >
        AI Coaching System
      </Typography>

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
          <Tab label="Training Programs" />
          <Tab label="Coaching Sessions" />
          <Tab label="Skill Assessments" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderTrainingPrograms()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderCoachingSessions()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderSkillAssessments()}
        </TabPanel>
      </Paper>

      {renderActiveSession()}
    </Box>
  );
};

export default CoachingSystem; 