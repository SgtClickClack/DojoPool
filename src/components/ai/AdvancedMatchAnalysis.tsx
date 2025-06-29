import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Grid, CircularProgress } from '@mui/material';
import { AnalyticsOutlined, TrackChanges, PsychologyOutlined } from '@mui/icons-material';
import TabPanel from '../common/TabPanel';
import { AdvancedAnalysisSession, SkillAssessment } from '../../types/analysis';

// Define constants for magic numbers
const ANALYSIS_PROGRESS_INTERVAL = 200; // ms
const ANALYSIS_PROGRESS_INCREMENT = 5; // %

// Mock data - in real app this would come from API
const MOCK_SESSIONS: AdvancedAnalysisSession[] = [
  {
    id: 'session_1',
    date: '2024-01-15',
    duration: 120,
    focusArea: 'Advanced Break Shot Analysis',
    exercises: ['Break Shot Consistency', 'Cue Ball Control', 'Speed Control', 'Mental Game'],
    performance: 85,
    notes: 'Excellent progress on break shots. Advanced tactical understanding demonstrated. Need to work on pressure situations.',
    coachRating: 4,
    mentalGameScore: 78,
    tacticalScore: 82,
    physicalScore: 88
  },
  {
    id: 'session_2',
    date: '2024-01-12',
    duration: 90,
    focusArea: 'Tactical Decision Making',
    exercises: ['Safety Shot Selection', 'Defensive Positioning', 'Tactical Play', 'Pattern Recognition'],
    performance: 78,
    notes: 'Good understanding of safety concepts. Advanced tactical thinking improving. More practice needed on execution under pressure.',
    coachRating: 3,
    mentalGameScore: 72,
    tacticalScore: 85,
    physicalScore: 75
  },
];

const MOCK_ASSESSMENTS: SkillAssessment[] = [
  {
    skill: 'Break Shot Mastery',
    currentLevel: 8,
    targetLevel: 10,
    progress: 80,
    exercises: ['Advanced Break Drills', 'Speed Control', 'Positioning', 'Mental Focus'],
    priority: 'high'
  },
  {
    skill: 'Tactical Decision Making',
    currentLevel: 7,
    targetLevel: 9,
    progress: 70,
    exercises: ['Game Analysis', 'Strategy Planning', 'Pattern Recognition', 'Risk Assessment'],
    priority: 'high'
  },
  {
    skill: 'Mental Game Under Pressure',
    currentLevel: 6,
    targetLevel: 9,
    progress: 60,
    exercises: ['Pressure Drills', 'Mental Game', 'Clutch Situations', 'Focus Training'],
    priority: 'medium'
  },
  {
    skill: 'Advanced Pattern Recognition',
    currentLevel: 8,
    targetLevel: 10,
    progress: 85,
    exercises: ['Pattern Drills', 'Game Analysis', 'Strategy Planning', 'Visualization'],
    priority: 'medium'
  },
];

const AdvancedMatchAnalysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisSessions, setAnalysisSessions] = useState<AdvancedAnalysisSession[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);

  // State for the active analysis
  const [selectedSession, setSelectedSession] = useState<AdvancedAnalysisSession | null>(null);
  const [isAnalysisActive, setIsAnalysisActive] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setAnalysisSessions(MOCK_SESSIONS);
        setSkillAssessments(MOCK_ASSESSMENTS);
      } catch (error) {
        console.error("Failed to load analysis data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Effect to run the analysis progress simulation
  useEffect(() => {
    if (!isAnalysisActive) {
      return;
    }

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsAnalysisActive(false);
          return 100;
        }
        return prev + ANALYSIS_PROGRESS_INCREMENT;
      });
    }, ANALYSIS_PROGRESS_INTERVAL);

    return () => {
      clearInterval(progressInterval);
    };
  }, [isAnalysisActive]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const startAdvancedAnalysis = useCallback((session: AdvancedAnalysisSession) => {
    setSelectedSession(session);
    setAnalysisProgress(0);
    setIsAnalysisActive(true);
  }, []);

  const handleFinishAnalysis = useCallback(() => {
    setIsAnalysisActive(false);
    setSelectedSession(null);
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ color: 'primary.main', mb: 3, fontWeight: 'bold' }}>
        Advanced AI Match Analysis & Coaching
      </Typography>

      <Paper 
        sx={{ 
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 2
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
          }}
        >
          <Tab icon={<AnalyticsOutlined />} label="Analysis Sessions" iconPosition="start" />
          <Tab icon={<TrackChanges />} label="Skill Assessments" iconPosition="start" />
          <Tab icon={<PsychologyOutlined />} label="Real-Time Coaching" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {isAnalysisActive && selectedSession ? (
            <Box>
              <Typography variant="h5" sx={{ color: '#00d4ff', mb: 3, fontWeight: 'bold' }}>
                Advanced Analysis in Progress
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Analyzing: {selectedSession.focusArea} - {analysisProgress}% Complete
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                Analysis Sessions ({analysisSessions.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a session to begin advanced AI analysis
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
              Skill Assessments ({skillAssessments.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your progress across different skill areas
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
              Real-Time AI Coaching
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get instant tactical advice and mental game support
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdvancedMatchAnalysis; 