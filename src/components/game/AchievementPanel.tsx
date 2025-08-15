import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  TrendingUp,
  Person,
  Group,
  LocationOn,
  Timer,
  CheckCircle,
  Lock,
  Info,
  Close,
  Celebration,
  MilitaryTech,
  WorkspacePremium,
  Psychology
} from '@mui/icons-material';
import progressionService from '../../services/progression/ProgressionService';

interface AchievementPanelProps {
  onAchievementUnlocked?: (achievement: any) => void;
  onClose?: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'story' | 'social' | 'tournament' | 'venue' | 'skill';
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: {
    experience: number;
    title?: string;
    avatarItem?: string;
    clanPrestige?: number;
  };
  unlockedAt?: string;
  icon?: string;
}

const AchievementPanel: React.FC<AchievementPanelProps> = ({
  onAchievementUnlocked,
  onClose
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  // Use the imported progression service directly

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = () => {
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Tournament Champion',
        description: 'Win your first major tournament',
        category: 'tournament',
        isUnlocked: true,
        progress: 1,
        maxProgress: 1,
        reward: {
          experience: 500,
          title: 'Champion',
          avatarItem: 'champion_crown'
        },
        unlockedAt: '2025-01-28T10:30:00Z',
        icon: '🏆'
      },
      {
        id: '2',
        title: 'Rival Slayer',
        description: 'Defeat 5 different rivals in head-to-head matches',
        category: 'story',
        isUnlocked: false,
        progress: 3,
        maxProgress: 5,
        reward: {
          experience: 300,
          title: 'Rival Slayer',
          clanPrestige: 100
        },
        icon: '⚔️'
      },
      {
        id: '3',
        title: 'Venue Master',
        description: 'Master 3 different venues by winning 5 consecutive games at each',
        category: 'venue',
        isUnlocked: false,
        progress: 1,
        maxProgress: 3,
        reward: {
          experience: 800,
          title: 'Venue Master',
          avatarItem: 'master_badge'
        },
        icon: '🏢'
      },
      {
        id: '4',
        title: 'Social Butterfly',
        description: 'Join 3 different clans and participate in clan wars',
        category: 'social',
        isUnlocked: false,
        progress: 2,
        maxProgress: 3,
        reward: {
          experience: 200,
          title: 'Social Butterfly',
          clanPrestige: 50
        },
        icon: '🦋'
      },
      {
        id: '5',
        title: 'Speed Demon',
        description: 'Win 10 matches in under 5 minutes each',
        category: 'skill',
        isUnlocked: false,
        progress: 7,
        maxProgress: 10,
        reward: {
          experience: 400,
          title: 'Speed Demon',
          avatarItem: 'speed_boost'
        },
        icon: '⚡'
      },
      {
        id: '6',
        title: 'Territory Lord',
        description: 'Control 5 different territories simultaneously',
        category: 'venue',
        isUnlocked: false,
        progress: 2,
        maxProgress: 5,
        reward: {
          experience: 1000,
          title: 'Territory Lord',
          clanPrestige: 200
        },
        icon: '👑'
      }
    ];

    setAchievements(mockAchievements);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      story: <Psychology color="primary" />,
      social: <Group color="secondary" />,
      tournament: <EmojiEvents color="warning" />,
      venue: <LocationOn color="success" />,
      skill: <TrendingUp color="info" />
    };
    return icons[category as keyof typeof icons];
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      story: '#9C27B0',
      social: '#2196F3',
      tournament: '#FF9800',
      venue: '#4CAF50',
      skill: '#00BCD4'
    };
    return colors[category as keyof typeof colors];
  };

  const getProgressColor = (progress: number, maxProgress: number) => {
    const percentage = (progress / maxProgress) * 100;
    if (percentage >= 100) return '#4CAF50';
    if (percentage >= 75) return '#FF9800';
    if (percentage >= 50) return '#2196F3';
    return '#F44336';
  };

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    if (achievement.isUnlocked) {
      setShowUnlockDialog(true);
    }
  };

  const handleClaimReward = (achievement: Achievement) => {
    // Simulate claiming reward
    progressionService.addExperience(achievement.reward.experience);
    onAchievementUnlocked?.(achievement);
    setShowUnlockDialog(false);
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <Card sx={{ maxWidth: 800, width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="primary" />
            Achievements
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Progress Overview */}
        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Progress Overview
              </Typography>
              <Chip 
                label={`${unlockedCount}/${totalCount}`} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(unlockedCount / totalCount) * 100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {totalCount - unlockedCount} achievements remaining
            </Typography>
          </CardContent>
        </Card>

        {/* Achievement Categories */}
        <Grid container spacing={2}>
          {(['story', 'social', 'tournament', 'venue', 'skill'] as const).map((category) => {
            const categoryAchievements = achievements.filter(a => a.category === category);
            const unlockedInCategory = categoryAchievements.filter(a => a.isUnlocked).length;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    borderColor: getCategoryColor(category),
                    '&:hover': {
                      borderWidth: 2,
                      cursor: 'pointer'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getCategoryIcon(category)}
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {category}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {unlockedInCategory}/{categoryAchievements.length} completed
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(unlockedInCategory / categoryAchievements.length) * 100}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getCategoryColor(category)
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Achievement List */}
        <Typography variant="h6" gutterBottom>
          All Achievements
        </Typography>

        <Grid container spacing={2}>
          {achievements.map((achievement) => (
            <Grid item xs={12} sm={6} key={achievement.id}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  borderColor: achievement.isUnlocked ? getCategoryColor(achievement.category) : 'divider',
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleAchievementClick(achievement)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: achievement.isUnlocked ? getCategoryColor(achievement.category) : 'grey.400',
                        width: 40,
                        height: 40
                      }}
                    >
                      {achievement.isUnlocked ? (
                        <CheckCircle />
                      ) : (
                        <Lock />
                      )}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {achievement.icon} {achievement.title}
                        {achievement.isUnlocked && (
                          <Chip 
                            label="Unlocked" 
                            size="small" 
                            color="success" 
                            icon={<CheckCircle />}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.progress}/{achievement.maxProgress}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(achievement.progress / achievement.maxProgress) * 100}
                      sx={{ 
                        height: 6,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getProgressColor(achievement.progress, achievement.maxProgress)
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      icon={<Star />} 
                      label={`${achievement.reward.experience} XP`} 
                      size="small" 
                      variant="outlined" 
                    />
                    {achievement.reward.title && (
                      <Chip 
                        icon={<MilitaryTech />} 
                        label={achievement.reward.title} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                    {achievement.reward.clanPrestige && (
                      <Chip 
                        icon={<Group />} 
                        label={`${achievement.reward.clanPrestige} Prestige`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>

      {/* Achievement Unlock Dialog */}
      <Dialog open={showUnlockDialog} onClose={() => setShowUnlockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Celebration color="primary" />
          Achievement Unlocked!
        </DialogTitle>
        <DialogContent>
          {selectedAchievement && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: getCategoryColor(selectedAchievement.category)
                  }}
                >
                  <EmojiEvents sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {selectedAchievement.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {selectedAchievement.description}
                </Typography>
              </Box>

              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Congratulations! You've earned the following rewards:
                </Typography>
              </Alert>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Star color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${selectedAchievement.reward.experience} Experience Points`}
                    secondary="Added to your progression"
                  />
                </ListItem>
                {selectedAchievement.reward.title && (
                  <ListItem>
                    <ListItemIcon>
                      <MilitaryTech color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Title: ${selectedAchievement.reward.title}`}
                      secondary="New title unlocked"
                    />
                  </ListItem>
                )}
                {selectedAchievement.reward.avatarItem && (
                  <ListItem>
                    <ListItemIcon>
                      <WorkspacePremium color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Avatar Item: ${selectedAchievement.reward.avatarItem}`}
                      secondary="New cosmetic item available"
                    />
                  </ListItem>
                )}
                {selectedAchievement.reward.clanPrestige && (
                  <ListItem>
                    <ListItemIcon>
                      <Group color="info" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${selectedAchievement.reward.clanPrestige} Clan Prestige`}
                      secondary="Added to your clan's prestige"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnlockDialog(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => selectedAchievement && handleClaimReward(selectedAchievement)}
            startIcon={<Celebration />}
          >
            Claim Rewards
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AchievementPanel; 