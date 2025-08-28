import {
  MonetizationOn as CoinsIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  PlayArrow as PlayIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  VenueQuest,
  getUserQuestProgress,
  getVenue,
  getVenueQuests,
  joinVenueQuest,
} from '../../src/frontend/api/venues';

interface Venue {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
  };
  rating: number;
  reviewCount: number;
  tables: number;
  photos: string[];
  status: string;
  features: {
    hasFood: boolean;
    hasBar: boolean;
    hasTournaments: boolean;
  };
}

const DojoDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [venue, setVenue] = useState<Venue | null>(null);
  const [quests, setQuests] = useState<VenueQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuest, setSelectedQuest] = useState<VenueQuest | null>(null);
  const [questDialogOpen, setQuestDialogOpen] = useState(false);
  const [userQuestProgress, setUserQuestProgress] = useState<{
    completed: boolean;
    progress: number;
    requirements: VenueQuest['requirements'];
    rewards: VenueQuest['rewards'];
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [venueData, questsData] = await Promise.all([
        getVenue(id as string),
        getVenueQuests(id as string, 'active'),
      ]);
      setVenue(venueData);
      setQuests(questsData);
    } catch (error) {
      console.error('Failed to load dojo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestClick = async (quest: VenueQuest) => {
    setSelectedQuest(quest);
    try {
      const progress = await getUserQuestProgress(quest.venueId, quest.id);
      setUserQuestProgress(progress);
    } catch (error) {
      // If user hasn't joined the quest yet, progress will be null
      setUserQuestProgress(null);
    }
    setQuestDialogOpen(true);
  };

  const handleJoinQuest = async () => {
    if (!selectedQuest) return;

    try {
      await joinVenueQuest(selectedQuest.venueId, selectedQuest.id);
      // Refresh quest data
      loadData();
      setQuestDialogOpen(false);
    } catch (error) {
      console.error('Failed to join quest:', error);
    }
  };

  const handleCloseDialog = () => {
    setQuestDialogOpen(false);
    setSelectedQuest(null);
    setUserQuestProgress(null);
  };

  const getRequirementDescription = (req: VenueQuest['requirements']) => {
    const typeLabels = {
      wins: 'Win',
      games: 'Play',
      time: 'Spend time in',
      streak: 'Get winning streak of',
    };

    let desc = `${typeLabels[req.type]} ${req.value}`;
    if (req.gameType) {
      desc += ` ${req.gameType} games`;
    }

    return desc;
  };

  const getStatusColor = (status: VenueQuest['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: VenueQuest['status']) => {
    switch (status) {
      case 'active':
        return <StarIcon />;
      case 'completed':
        return <TrophyIcon />;
      case 'expired':
        return <TimeIcon />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography>Loading dojo...</Typography>
        </Box>
      </Container>
    );
  }

  if (!venue) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography>Dojo not found</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Venue Header */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" component="h1" gutterBottom>
                {venue.name}
              </Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon />
                  <Typography>
                    {venue.address.street}, {venue.address.city},{' '}
                    {venue.address.state}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon sx={{ color: '#ffd700' }} />
                  <Typography>
                    {venue.rating.toFixed(1)} ({venue.reviewCount} reviews)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon />
                  <Typography>{venue.tables} tables available</Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1}>
                {venue.features.hasFood && (
                  <Chip
                    label="Food Available"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
                {venue.features.hasBar && (
                  <Chip
                    label="Bar Available"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
                {venue.features.hasTournaments && (
                  <Chip
                    label="Tournaments"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              {venue.photos && venue.photos.length > 0 && (
                <Box
                  component="img"
                  src={venue.photos[0]}
                  alt={venue.name}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 2,
                    boxShadow: 3,
                  }}
                />
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Venue Quests Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <TrophyIcon sx={{ color: '#ffd700' }} />
            Venue Quests
          </Typography>

          {quests.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No active quests available at this venue. Check back later for new
              challenges!
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {quests.map((quest) => (
                <Grid item xs={12} md={6} lg={4} key={quest.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                      border:
                        quest.status === 'active'
                          ? '2px solid #4caf50'
                          : '1px solid #e0e0e0',
                    }}
                    onClick={() => handleQuestClick(quest)}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{ flex: 1 }}
                        >
                          {quest.title}
                        </Typography>
                        <Chip
                          label={quest.status.toUpperCase()}
                          color={getStatusColor(quest.status)}
                          icon={getStatusIcon(quest.status)}
                          size="small"
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 40 }}
                      >
                        {quest.description}
                      </Typography>

                      {/* Requirements */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ mb: 1 }}
                        >
                          Requirements:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getRequirementDescription(quest.requirements)}
                        </Typography>
                      </Box>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2">
                            Participants: {quest.currentParticipants}/
                            {quest.maxParticipants}
                          </Typography>
                          <Typography variant="body2">
                            {Math.round(
                              (quest.currentParticipants /
                                quest.maxParticipants) *
                                100
                            )}
                            %
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (quest.currentParticipants /
                              quest.maxParticipants) *
                            100
                          }
                          sx={{ height: 6, borderRadius: 3 }}
                          color={
                            quest.currentParticipants >= quest.maxParticipants
                              ? 'secondary'
                              : 'primary'
                          }
                        />
                      </Box>

                      {/* Rewards */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ mb: 1 }}
                        >
                          Rewards:
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={`${quest.rewards.dojoCoins} Coins`}
                            size="small"
                            sx={{ bgcolor: '#4caf50', color: 'white' }}
                          />
                          <Chip
                            label={`${quest.rewards.xp} XP`}
                            size="small"
                            sx={{ bgcolor: '#ff9800', color: 'white' }}
                          />
                        </Stack>
                      </Box>

                      {/* Action Button */}
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PlayIcon />}
                        sx={{ bgcolor: '#00a8ff', color: 'white' }}
                      >
                        View Quest Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Venue Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: '#00a8ff', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {venue.tables}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pool Tables
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 40, color: '#ffd700', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {venue.rating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {quests.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Quests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quest Details Dialog */}
        <Dialog
          open={questDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrophyIcon sx={{ color: '#ffd700' }} />
            {selectedQuest?.title}
          </DialogTitle>
          <DialogContent>
            {selectedQuest && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {selectedQuest.description}
                </Typography>

                {/* Requirements Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Quest Requirements
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getRequirementDescription(selectedQuest.requirements)}
                  </Typography>
                </Box>

                {/* Rewards Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Quest Rewards
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: 2,
                          bgcolor: '#f5f5f5',
                          borderRadius: 2,
                        }}
                      >
                        <CoinsIcon
                          sx={{ fontSize: 32, color: '#4caf50', mb: 1 }}
                        />
                        <Typography variant="h6">
                          {selectedQuest.rewards.dojoCoins}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Dojo Coins
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: 2,
                          bgcolor: '#f5f5f5',
                          borderRadius: 2,
                        }}
                      >
                        <StarIcon
                          sx={{ fontSize: 32, color: '#ff9800', mb: 1 }}
                        />
                        <Typography variant="h6">
                          {selectedQuest.rewards.xp}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          XP Points
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Progress Section */}
                {userQuestProgress && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Your Progress
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Progress:{' '}
                          {Math.round(userQuestProgress.progress * 100)}%
                        </Typography>
                        {userQuestProgress.completed && (
                          <Chip label="COMPLETED" color="success" />
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={userQuestProgress.progress * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                )}

                {/* Quest Stats */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Quest Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6">
                          {selectedQuest.currentParticipants}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Participants
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6">
                          {selectedQuest.maxParticipants}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Max Participants
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h6">
                          {selectedQuest.duration}d
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Duration
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            {!userQuestProgress && selectedQuest && (
              <Button
                onClick={handleJoinQuest}
                variant="contained"
                sx={{ bgcolor: '#00a8ff', color: 'white' }}
                disabled={
                  selectedQuest.currentParticipants >=
                  selectedQuest.maxParticipants
                }
              >
                {selectedQuest.currentParticipants >=
                selectedQuest.maxParticipants
                  ? 'Quest Full'
                  : 'Join Quest'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DojoDetailPage;
