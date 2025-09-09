import { apiClient } from '@/services/APIService';
import {
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  Lock as LockIcon,
  AccountTree as SkillTreeIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as UnlockedIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

// Types for skill progression system
interface SkillProgress {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: number;
  currentPoints: number;
  proficiencyScore: number;
  recentPoints: number;
  lastActivity: string;
}

interface SkillCategoryProgress {
  category: string;
  totalSkills: number;
  averageLevel: number;
  totalPoints: number;
  highestSkill?: SkillProgress;
}

interface SkillPointLog {
  id: string;
  skillId: string;
  skillName: string;
  points: number;
  reason: string;
  matchId?: string;
  createdAt: string;
  metadata?: any;
}

interface PlayerSkillProfile {
  playerId: string;
  username: string;
  totalSkills: number;
  averageLevel: number;
  totalPoints: number;
  topSkills: SkillProgress[];
  recentActivity: SkillPointLog[];
  skillCategories: SkillCategoryProgress[];
}

interface SkillProfile {
  id: string;
  skillId: string;
  skillName: string;
  skillDescription?: string;
  category: string;
  iconUrl?: string;
  currentLevel: number;
  currentPoints: number;
  totalPoints: number;
  proficiencyScore: number;
  maxLevel: number;
  pointsToNextLevel: number;
  unlockedAt?: string;
  lastUpdated: string;
}

const SkillsPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillProfile, setSkillProfile] = useState<PlayerSkillProfile | null>(
    null
  );
  const [userSkills, setUserSkills] = useState<SkillProfile[]>([]);

  useEffect(() => {
    loadSkillData();
  }, []);

  const loadSkillData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load both the overview and detailed skill profiles
      const [overviewResponse, skillsResponse] = await Promise.all([
        apiClient.get('/api/v1/skills/player/me'),
        apiClient.get('/api/v1/skills/me'),
      ]);

      setSkillProfile(overviewResponse.data);
      setUserSkills(skillsResponse.data);
    } catch (err) {
      console.error('Failed to load skill data:', err);
      setError('Failed to load skill progression data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your skill progression...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadSkillData} variant="outlined">
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
      >
        <SkillTreeIcon sx={{ mr: 2 }} />
        Player Skill Progression & Mastery
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<AssessmentIcon />} label="Overview" />
          <Tab icon={<SkillTreeIcon />} label="Skill Tree" />
          <Tab icon={<TimelineIcon />} label="Progress History" />
          <Tab icon={<TrophyIcon />} label="Achievements" />
        </Tabs>
      </Paper>

      {activeTab === 0 && skillProfile && (
        <SkillOverviewTab skillProfile={skillProfile} />
      )}

      {activeTab === 1 && <SkillTreeTab skills={userSkills} />}

      {activeTab === 2 && skillProfile && (
        <ProgressHistoryTab recentActivity={skillProfile.recentActivity} />
      )}

      {activeTab === 3 && <AchievementsTab />}
    </Container>
  );
};

// Overview Tab Component
interface SkillOverviewTabProps {
  skillProfile: PlayerSkillProfile;
}

const SkillOverviewTab: React.FC<SkillOverviewTabProps> = ({
  skillProfile,
}) => {
  return (
    <Grid container spacing={3}>
      {/* Overall Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Overall Mastery" avatar={<TrophyIcon />} />
          <CardContent>
            <Typography variant="h3" color="primary" gutterBottom>
              {skillProfile.averageLevel.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Skill Level
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">
              {skillProfile.totalPoints.toLocaleString()} Total Points
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Across {skillProfile.totalSkills} skills
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Skills */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Top Skills" avatar={<StarIcon />} />
          <CardContent>
            <Grid container spacing={2}>
              {skillProfile.topSkills.slice(0, 6).map((skill, index) => (
                <Grid item xs={12} sm={6} key={skill.skillId}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center">
                      <Badge
                        badgeContent={index + 1}
                        color={index < 3 ? 'primary' : 'default'}
                        sx={{ mr: 2 }}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {skill.skillName.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="subtitle2">
                          {skill.skillName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Level {skill.currentLevel}
                        </Typography>
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2">
                        {skill.currentPoints} pts
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={skill.proficiencyScore}
                        sx={{ width: 60, height: 4 }}
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Skill Categories */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Skill Categories" avatar={<CategoryIcon />} />
          <CardContent>
            <Grid container spacing={2}>
              {skillProfile.skillCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.category}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {category.category.replace('_', ' ')}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Skills:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {category.totalSkills}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Avg Level:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {category.averageLevel.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Total Points:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {category.totalPoints.toLocaleString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Skill Tree Tab Component
interface SkillTreeTabProps {
  skills: SkillProfile[];
}

const SkillTreeTab: React.FC<SkillTreeTabProps> = ({ skills }) => {
  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, SkillProfile[]>
  );

  return (
    <Grid container spacing={3}>
      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        <Grid item xs={12} key={category}>
          <Card>
            <CardHeader
              title={category.replace('_', ' ')}
              avatar={<CategoryIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                {categorySkills.map((skill) => (
                  <Grid item xs={12} sm={6} md={4} key={skill.skillId}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        border:
                          skill.currentLevel > 0 ? '2px solid' : '1px solid',
                        borderColor:
                          skill.currentLevel > 0 ? 'primary.main' : 'divider',
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          sx={{
                            bgcolor:
                              skill.currentLevel > 0
                                ? 'primary.main'
                                : 'grey.400',
                            mr: 2,
                          }}
                        >
                          {skill.currentLevel > 0 ? (
                            <UnlockedIcon />
                          ) : (
                            <LockIcon />
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {skill.skillName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Level {skill.currentLevel} / {skill.maxLevel}
                          </Typography>
                        </Box>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={(skill.currentLevel / skill.maxLevel) * 100}
                        sx={{ mb: 1 }}
                      />

                      <Typography variant="body2" gutterBottom>
                        Proficiency: {skill.proficiencyScore.toFixed(1)}%
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {skill.currentPoints.toLocaleString()} /{' '}
                        {(skill.currentLevel + 1) * skill.pointsToNextLevel}{' '}
                        points
                      </Typography>

                      {skill.pointsToNextLevel > 0 && (
                        <Typography variant="body2" color="primary">
                          {skill.pointsToNextLevel} points to next level
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Progress History Tab Component
interface ProgressHistoryTabProps {
  recentActivity: SkillPointLog[];
}

const ProgressHistoryTab: React.FC<ProgressHistoryTabProps> = ({
  recentActivity,
}) => {
  return (
    <Card>
      <CardHeader title="Recent Skill Progress" avatar={<TimelineIcon />} />
      <CardContent>
        {recentActivity.length === 0 ? (
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            py={4}
          >
            No recent skill activity found. Complete matches to start earning
            skill points!
          </Typography>
        ) : (
          <Box>
            {recentActivity.map((activity) => (
              <Paper
                key={activity.id}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {activity.skillName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.reason}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`+${activity.points} pts`}
                  color="primary"
                  size="small"
                />
              </Paper>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Achievements Tab Component (placeholder for now)
const AchievementsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader title="Skill-Based Achievements" avatar={<TrophyIcon />} />
      <CardContent>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          py={4}
        >
          Skill-based achievements will be displayed here once implemented. This
          will show titles and special abilities unlocked through skill mastery.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SkillsPage;
