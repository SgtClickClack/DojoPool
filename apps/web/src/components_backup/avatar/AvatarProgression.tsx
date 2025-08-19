import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  ListItemButton,
} from '@mui/material';
import {
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Style as StyleIcon,
  AutoAwesome as EffectIcon,
  WorkspacePremium as BadgeIcon,
  Visibility as ViewIcon,
  CheckCircle as UnlockedIcon,
  Lock as LockedIcon,
  TrendingUp as LevelIcon,
} from '@mui/icons-material';
import avatarProgressionService from '../../services/avatar/AvatarProgressionService';
import type {
  AvatarProgression,
  AvatarFeature,
  StoryAchievement,
  VenueMastery,
} from '../../services/avatar/AvatarProgressionService';
import Grid from '@mui/material/Grid';

interface AvatarProgressionProps {
  userId: string;
}

const AvatarProgression: React.FC<AvatarProgressionProps> = ({ userId }) => {
  const [progression, setProgression] = useState<AvatarProgression | null>(
    null
  );
  const [selectedFeature, setSelectedFeature] = useState<AvatarFeature | null>(
    null
  );
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [storyEventDialogOpen, setStoryEventDialogOpen] = useState(false);
  const [storyEventMessage, setStoryEventMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const userProgression =
      avatarProgressionService.getUserAvatarProgression(userId);
    setProgression(userProgression);
  }, [userId]);

  if (!progression) {
    return <Typography>Loading avatar progression...</Typography>;
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#ffd700';
      case 'epic':
        return '#9c27b0';
      case 'rare':
        return '#2196f3';
      case 'common':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'outfit':
        return <StyleIcon />;
      case 'accessory':
        return <PersonIcon />;
      case 'effect':
        return <EffectIcon />;
      case 'badge':
        return <BadgeIcon />;
      case 'animation':
        return <ViewIcon />;
      default:
        return <StarIcon />;
    }
  };

  const handleFeatureClick = (feature: AvatarFeature) => {
    setSelectedFeature(feature);
    setFeatureDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setFeatureDialogOpen(false);
    setSelectedFeature(null);
  };

  const calculateLevelProgress = () => {
    const expForNextLevel = progression.currentLevel * 100;
    const currentExp = progression.experience % 100;
    return (currentExp / 100) * 100;
  };

  const handleStartDemoStoryArc = () => {
    const demoArc = {
      id: 'demo_arc',
      title: 'The Road to Pool Mastery',
      description: 'Begin your journey to become a legendary pool player.',
      steps: [
        {
          id: 'step1',
          description: 'Win your first match',
          isComplete: false,
          eventType: 'win_match',
        },
        {
          id: 'step2',
          description: 'Defeat a rival',
          isComplete: false,
          eventType: 'defeat_rival',
        },
        {
          id: 'step3',
          description: 'Master a venue',
          isComplete: false,
          eventType: 'venue_mastery',
        },
      ],
      currentStep: 0,
      isComplete: false,
      startedAt: new Date(),
    };
    avatarProgressionService.startStoryArc(userId, demoArc);
    setProgression({
      ...avatarProgressionService.getUserAvatarProgression(userId),
    });
    setStoryEventMessage('Demo story arc started!');
    setStoryEventDialogOpen(true);
  };

  const handleAdvanceStoryArc = () => {
    avatarProgressionService.advanceStoryArc(userId);
    setProgression({
      ...avatarProgressionService.getUserAvatarProgression(userId),
    });
    setStoryEventMessage('Story arc advanced!');
    setStoryEventDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: 'primary.main', mb: 3 }}
      >
        Avatar Progression
      </Typography>

      {/* Level and Experience */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LevelIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Level {progression.currentLevel} - {progression.experience} XP
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={calculateLevelProgress()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      {/* Narrative Story Arc */}
      {!progression.storyArc && (
        <Button
          variant="contained"
          color="secondary"
          sx={{ mb: 3 }}
          onClick={handleStartDemoStoryArc}
        >
          Start Demo Story Arc
        </Button>
      )}
      {progression.storyArc && !progression.storyArc.isComplete && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 3 }}
          onClick={handleAdvanceStoryArc}
        >
          Advance Story Arc
        </Button>
      )}

      {progression.storyArc && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: 'secondary.main' }}
            >
              Story Arc: {progression.storyArc.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {progression.storyArc.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Step {progression.storyArc.currentStep + 1} /{' '}
              {progression.storyArc.steps.length}:{' '}
              {
                progression.storyArc.steps[progression.storyArc.currentStep]
                  ?.description
              }
            </Typography>
            {progression.storyArc.rivalUserId && (
              <Chip
                label={`Rival: ${progression.storyArc.rivalUserId}`}
                color="error"
                sx={{ mt: 1 }}
              />
            )}
            <LinearProgress
              variant="determinate"
              value={
                ((progression.storyArc.currentStep +
                  (progression.storyArc.isComplete ? 1 : 0)) /
                  progression.storyArc.steps.length) *
                100
              }
              sx={{ height: 8, borderRadius: 4, mt: 2 }}
            />
            {progression.storyArc.isComplete && (
              <Chip label="Arc Complete" color="success" sx={{ mt: 2 }} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Evolution Stage */}
      {progression.evolutionStage && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
              Evolution Stage: {progression.evolutionStage}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Pool God Blessings */}
      {progression.poolGodBlessings &&
        progression.poolGodBlessings.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: 'warning.main' }}
              >
                Pool God Blessings
              </Typography>
              <List dense>
                {progression.poolGodBlessings.map((blessing) => (
                  <ListItem
                    key={blessing.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      <StarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${blessing.god}: ${blessing.effect}`}
                      secondary={`Granted: ${blessing.grantedAt.toLocaleString()}${blessing.expiresAt ? `, Expires: ${blessing.expiresAt.toLocaleString()}` : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

      <Grid container spacing={3}>
        {/* Unlocked Features */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <UnlockedIcon sx={{ mr: 1, color: 'success.main' }} />
                Unlocked Features ({progression.unlockedFeatures.length})
              </Typography>
              <List dense>
                {progression.unlockedFeatures.map((feature) => (
                  <ListItemButton
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        borderColor: getRarityColor(feature.rarity),
                        backgroundColor: `${getRarityColor(feature.rarity)}10`,
                      },
                    }}
                  >
                    <ListItemIcon>{getFeatureIcon(feature.type)}</ListItemIcon>
                    <ListItemText
                      primary={feature.name}
                      secondary={
                        <Box>
                          <Chip
                            label={feature.rarity}
                            size="small"
                            sx={{
                              backgroundColor: getRarityColor(feature.rarity),
                              color: 'white',
                              mr: 1,
                            }}
                          />
                          {feature.storyContext && (
                            <Chip
                              label={feature.storyContext}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Story Achievements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <TrophyIcon sx={{ mr: 1, color: 'warning.main' }} />
                Story Achievements ({progression.storyAchievements.length})
              </Typography>
              <List dense>
                {progression.storyAchievements
                  .slice(-5)
                  .reverse()
                  .map((achievement) => (
                    <ListItem
                      key={achievement.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        <TrophyIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={achievement.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {achievement.description}
                            </Typography>
                            <Chip
                              label={achievement.type}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Venue Mastery */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Venue Mastery
              </Typography>
              <Grid container spacing={2}>
                {progression.venueMastery.map((mastery) => (
                  <Grid item xs={12} sm={6} md={4} key={mastery.venueId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {mastery.venueName}
                        </Typography>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            Level {mastery.masteryLevel}
                          </Typography>
                          <Box sx={{ display: 'flex' }}>
                            {[1, 2, 3, 4, 5].map((level) => (
                              <StarIcon
                                key={level}
                                sx={{
                                  color:
                                    level <= mastery.masteryLevel
                                      ? 'warning.main'
                                      : 'grey.300',
                                  fontSize: 16,
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {mastery.gamesWon}/{mastery.gamesPlayed} wins
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {mastery.visualRewards.map((reward) => (
                            <Chip
                              key={reward.id}
                              label={reward.name}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Effects */}
        {progression.activeEffects.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <EffectIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  Active Effects ({progression.activeEffects.length})
                </Typography>
                <Grid container spacing={2}>
                  {progression.activeEffects.map((effect) => (
                    <Grid item xs={12} sm={6} md={4} key={effect.id}>
                      <Card
                        variant="outlined"
                        sx={{ backgroundColor: 'secondary.light' }}
                      >
                        <CardContent>
                          <Typography variant="subtitle2">
                            {effect.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {effect.type} • Intensity:{' '}
                            {Math.round(effect.intensity * 100)}%
                          </Typography>
                          {effect.duration > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Duration: {effect.duration}s
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Feature Details Dialog */}
      <Dialog
        open={featureDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedFeature && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
              {getFeatureIcon(selectedFeature.type)}
              <Typography sx={{ ml: 1 }}>{selectedFeature.name}</Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={selectedFeature.rarity}
                  sx={{
                    backgroundColor: getRarityColor(selectedFeature.rarity),
                    color: 'white',
                    mr: 1,
                  }}
                />
                <Chip label={selectedFeature.type} variant="outlined" />
              </Box>
              <Typography variant="body1" paragraph>
                {selectedFeature.storyContext}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unlock Condition: {selectedFeature.unlockCondition}
              </Typography>
              {selectedFeature.unlockDate && (
                <Typography variant="body2" color="text.secondary">
                  Unlocked: {selectedFeature.unlockDate.toLocaleDateString()}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={storyEventDialogOpen}
        onClose={() => setStoryEventDialogOpen(false)}
      >
        <DialogTitle>Narrative Event</DialogTitle>
        <DialogContent>
          <Typography>{storyEventMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStoryEventDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvatarProgression;
