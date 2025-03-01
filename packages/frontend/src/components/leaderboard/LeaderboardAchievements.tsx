import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  CardActionArea,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';
import leaderboardService from '../../services/leaderboardService';
import websocketService from '../../services/websocketService';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  nextTier?: {
    title: string;
    description: string;
    threshold: number;
  };
}

interface LeaderboardAchievementsProps {
  userId?: string;
  venueId?: string;
  className?: string;
}

// Helper function to determine color based on rarity
const getRarityColor = (rarity: string, theme: any) => {
  switch (rarity) {
    case 'common': return theme.palette.grey[500];
    case 'uncommon': return theme.palette.success.main;
    case 'rare': return theme.palette.info.main;
    case 'epic': return theme.palette.secondary.main;
    case 'legendary': return theme.palette.warning.main;
    default: return theme.palette.grey[500];
  }
};

export const LeaderboardAchievements: React.FC<LeaderboardAchievementsProps> = ({
  userId,
  venueId,
  className,
}) => {
  const theme = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAchievementNotification, setNewAchievementNotification] = useState(false);
  
  // Load achievements
  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = userId 
        ? await leaderboardService.getUserAchievements(userId)
        : await leaderboardService.getCurrentUserAchievements();
      
      if (venueId) {
        // Filter achievements related to this venue if venueId is provided
        const venueAchievements = data.filter(achievement => 
          achievement.id.includes(`venue_${venueId}`) || 
          !achievement.id.includes('venue_') // Include general achievements
        );
        setAchievements(venueAchievements);
      } else {
        setAchievements(data);
      }
      
      setNewAchievementNotification(false);
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Subscribe to achievement updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (userId) {
      unsubscribe = websocketService.subscribe<{ achievement: Achievement }>('achievement_update', (data) => {
        if (data.achievement) {
          // Update the achievements list
          setAchievements(prevAchievements => {
            const index = prevAchievements.findIndex(a => a.id === data.achievement.id);
            if (index !== -1) {
              // Update existing achievement
              const newAchievements = [...prevAchievements];
              newAchievements[index] = data.achievement;
              return newAchievements;
            } else {
              // Add new achievement
              return [...prevAchievements, data.achievement];
            }
          });
          
          // Show notification
          setNewAchievementNotification(true);
        }
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);
  
  // Initial load
  useEffect(() => {
    loadAchievements();
  }, [userId, venueId]);
  
  // Handle achievement click
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setDialogOpen(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadAchievements();
  };
  
  // Group achievements by rarity
  const groupedAchievements = achievements.reduce<Record<string, Achievement[]>>((acc, achievement) => {
    if (!acc[achievement.rarity]) {
      acc[achievement.rarity] = [];
    }
    acc[achievement.rarity].push(achievement);
    return acc;
  }, {});
  
  // Order of rarity from highest to lowest
  const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  
  // Render loading state
  if (loading && achievements.length === 0) {
    return (
      <Paper elevation={2} className={className} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EmojiEventsIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <Typography variant="h6" component="h2">
            Achievements
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Paper elevation={2} className={className} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EmojiEventsIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <Typography variant="h6" component="h2">
            Achievements
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Typography color="error" align="center">
          {error}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" color="primary" onClick={handleRefresh}>
            Try Again
          </Button>
        </Box>
      </Paper>
    );
  }
  
  // Calculate overall progress
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
  
  return (
    <Paper elevation={2} className={className} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge 
            color="error" 
            variant="dot" 
            invisible={!newAchievementNotification}
            sx={{ mr: 1 }}
          >
            <EmojiEventsIcon sx={{ color: theme.palette.primary.main }} />
          </Badge>
          <Typography variant="h6" component="h2">
            Achievements
          </Typography>
        </Box>
        <Tooltip title="Refresh achievements">
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Progress summary */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Overall Progress
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {unlockedCount}/{totalCount}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Achievements by rarity */}
      {achievements.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ my: 4 }}>
          No achievements found. Start playing to earn achievements!
        </Typography>
      ) : (
        rarityOrder.map(rarity => {
          const rarityAchievements = groupedAchievements[rarity] || [];
          if (rarityAchievements.length === 0) return null;
          
          return (
            <Box key={rarity} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ color: getRarityColor(rarity, theme), mr: 1, fontSize: '1rem' }} />
                <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                  {rarity} Achievements
                </Typography>
                <Chip 
                  label={`${rarityAchievements.filter(a => a.unlocked).length}/${rarityAchievements.length}`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
              
              <Grid container spacing={2}>
                {rarityAchievements.map(achievement => (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    <Card 
                      sx={{ 
                        opacity: achievement.unlocked ? 1 : 0.7,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                    >
                      <CardActionArea onClick={() => handleAchievementClick(achievement)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 40, 
                                height: 40,
                                bgcolor: getRarityColor(achievement.rarity, theme),
                                color: 'white',
                                borderRadius: '50%',
                                mr: 1.5
                              }}
                            >
                              {achievement.unlocked ? (
                                <EmojiEventsIcon />
                              ) : (
                                <LockIcon />
                              )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" component="h3" noWrap>
                                {achievement.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  height: '40px'
                                }}
                              >
                                {achievement.description}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {achievement.maxProgress > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Progress
                                </Typography>
                                <Typography variant="caption" fontWeight="medium">
                                  {achievement.progress}/{achievement.maxProgress}
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={(achievement.progress / achievement.maxProgress) * 100} 
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })
      )}
      
      {/* Achievement detail dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <DialogTitle sx={{ bgcolor: getRarityColor(selectedAchievement.rarity, theme), color: 'white' }}>
              {selectedAchievement.title}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60, 
                    height: 60,
                    bgcolor: getRarityColor(selectedAchievement.rarity, theme),
                    color: 'white',
                    borderRadius: '50%',
                    mr: 2,
                    fontSize: '2rem'
                  }}
                >
                  {selectedAchievement.unlocked ? (
                    <EmojiEventsIcon fontSize="large" />
                  ) : (
                    <LockIcon fontSize="large" />
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ color: getRarityColor(selectedAchievement.rarity, theme), mr: 0.5, fontSize: '1rem' }} />
                    {selectedAchievement.rarity}
                  </Typography>
                  <Typography variant="body1">
                    {selectedAchievement.description}
                  </Typography>
                  {selectedAchievement.unlocked && selectedAchievement.unlockedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Unlocked on {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {selectedAchievement.maxProgress > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Progress
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round((selectedAchievement.progress / selectedAchievement.maxProgress) * 100)}% Complete
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(selectedAchievement.progress / selectedAchievement.maxProgress) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
              
              {selectedAchievement.nextTier && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: `1px dashed ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Next Tier
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedAchievement.nextTier.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAchievement.nextTier.description}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Requires: {selectedAchievement.nextTier.threshold} progress
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default LeaderboardAchievements; 