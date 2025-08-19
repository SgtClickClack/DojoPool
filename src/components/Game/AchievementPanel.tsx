import { CheckCircle, Close, Lock } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementPanelProps {
  onAchievementUnlocked?: (achievement: Achievement) => void;
  onClose?: () => void;
}

const mockAchievements: Achievement[] = [
  {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win your first pool match',
    category: 'Gameplay',
    points: 10,
    isUnlocked: true,
    progress: 1,
    maxProgress: 1,
    icon: '🏆',
    rarity: 'common',
  },
  {
    id: 'tournament_champion',
    title: 'Tournament Champion',
    description: 'Win a tournament with 8+ participants',
    category: 'Competition',
    points: 100,
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
    icon: '👑',
    rarity: 'epic',
  },
  {
    id: 'dojo_master',
    title: 'Dojo Master',
    description: 'Control 5 different dojos',
    category: 'Territory',
    points: 250,
    isUnlocked: false,
    progress: 2,
    maxProgress: 5,
    icon: '🏛️',
    rarity: 'legendary',
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Win 10 matches in a row',
    category: 'Gameplay',
    points: 75,
    isUnlocked: false,
    progress: 7,
    maxProgress: 10,
    icon: '🔥',
    rarity: 'rare',
  },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'default';
    case 'rare':
      return 'primary';
    case 'epic':
      return 'secondary';
    case 'legendary':
      return 'warning';
    default:
      return 'default';
  }
};

export const AchievementPanel: React.FC<AchievementPanelProps> = ({
  onAchievementUnlocked,
  onClose,
}) => {
  const [achievements, setAchievements] =
    useState<Achievement[]>(mockAchievements);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDetails(true);
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements((prev) =>
      prev.map((ach) =>
        ach.id === achievementId
          ? { ...ach, isUnlocked: true, progress: ach.maxProgress }
          : ach
      )
    );

    const achievement = achievements.find((ach) => ach.id === achievementId);
    if (achievement && onAchievementUnlocked) {
      onAchievementUnlocked(achievement);
    }
  };

  const totalPoints = achievements
    .filter((ach) => ach.isUnlocked)
    .reduce((sum, ach) => sum + ach.points, 0);

  const unlockedCount = achievements.filter((ach) => ach.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <>
      <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            🏆 Achievements
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Progress: {unlockedCount}/{totalCount} (
            {Math.round((unlockedCount / totalCount) * 100)}%)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(unlockedCount / totalCount) * 100}
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            Total Points: {totalPoints}
          </Typography>
        </Box>

        <List>
          {achievements.map((achievement) => (
            <ListItem
              key={achievement.id}
              button
              onClick={() => handleAchievementClick(achievement)}
              sx={{
                border: 1,
                borderColor: achievement.isUnlocked
                  ? 'success.main'
                  : 'divider',
                borderRadius: 1,
                mb: 1,
                opacity: achievement.isUnlocked ? 1 : 0.7,
              }}
            >
              <ListItemIcon>
                {achievement.isUnlocked ? (
                  <CheckCircle color="success" />
                ) : (
                  <Lock color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" component="span">
                      {achievement.icon} {achievement.title}
                    </Typography>
                    <Chip
                      label={achievement.rarity}
                      size="small"
                      color={getRarityColor(achievement.rarity) as any}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {achievement.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {achievement.points} pts
                      </Typography>
                      {!achievement.isUnlocked && (
                        <Typography variant="caption" color="text.secondary">
                          • Progress: {achievement.progress}/
                          {achievement.maxProgress}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedAchievement?.icon} {selectedAchievement?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAchievement && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedAchievement.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Category: {selectedAchievement.category}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Points: {selectedAchievement.points}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Rarity: {selectedAchievement.rarity}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status:{' '}
                    {selectedAchievement.isUnlocked ? 'Unlocked' : 'Locked'}
                  </Typography>
                </Grid>
              </Grid>

              {!selectedAchievement.isUnlocked && (
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Progress: {selectedAchievement.progress}/
                    {selectedAchievement.maxProgress}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (selectedAchievement.progress /
                        selectedAchievement.maxProgress) *
                      100
                    }
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          {selectedAchievement && !selectedAchievement.isUnlocked && (
            <Button
              variant="contained"
              onClick={() => {
                unlockAchievement(selectedAchievement.id);
                setShowDetails(false);
              }}
            >
              Unlock Achievement
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AchievementPanel;
