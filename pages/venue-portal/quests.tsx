import {
  Add as AddIcon,
  MonetizationOn as CoinsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Star as StarIcon,
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  QuestCreationData,
  VenueQuest,
  createVenueQuest,
  deleteVenueQuest,
  getVenueQuests,
  updateVenueQuest,
} from '../../src/frontend/api/venues';

interface QuestFormData extends QuestCreationData {
  title: string;
  description: string;
  requirements: {
    type: 'wins' | 'games' | 'time' | 'streak';
    value: number;
    gameType?: string;
  };
  rewards: {
    dojoCoins: number;
    xp: number;
    items?: string[];
  };
  duration: number;
  maxParticipants: number;
}

const VenueQuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<VenueQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState<VenueQuest | null>(null);
  const [formData, setFormData] = useState<QuestFormData>({
    title: '',
    description: '',
    requirements: {
      type: 'wins',
      value: 1,
      gameType: '',
    },
    rewards: {
      dojoCoins: 100,
      xp: 50,
      items: [],
    },
    duration: 7,
    maxParticipants: 50,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Mock venue ID - in real app this would come from auth context
  const venueId = 1;

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const questsData = await getVenueQuests(venueId);
      setQuests(questsData);
    } catch (error) {
      showSnackbar('Failed to load quests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (quest?: VenueQuest) => {
    if (quest) {
      setEditingQuest(quest);
      setFormData({
        title: quest.title,
        description: quest.description,
        requirements: quest.requirements,
        rewards: quest.rewards,
        duration: quest.duration,
        maxParticipants: quest.maxParticipants,
      });
    } else {
      setEditingQuest(null);
      setFormData({
        title: '',
        description: '',
        requirements: {
          type: 'wins',
          value: 1,
          gameType: '',
        },
        rewards: {
          dojoCoins: 100,
          xp: 50,
          items: [],
        },
        duration: 7,
        maxParticipants: 50,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuest(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingQuest) {
        await updateVenueQuest(venueId, editingQuest.id, formData);
        showSnackbar('Quest updated successfully', 'success');
      } else {
        await createVenueQuest(venueId, formData);
        showSnackbar('Quest created successfully', 'success');
      }
      handleCloseDialog();
      loadQuests();
    } catch (error) {
      showSnackbar('Failed to save quest', 'error');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    try {
      await deleteVenueQuest(venueId, questId);
      showSnackbar('Quest deleted successfully', 'success');
      loadQuests();
    } catch (error) {
      showSnackbar('Failed to delete quest', 'error');
    }
  };

  const getRequirementDescription = (req: VenueQuest['requirements']) => {
    const typeLabels = {
      wins: 'Win',
      games: 'Play',
      time: 'Spend time',
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
        return <PeopleIcon />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography>Loading quests...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Venue Quest Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create engaging quests to motivate players and increase venue
              activity
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#00a8ff', color: 'white' }}
          >
            Create New Quest
          </Button>
        </Box>

        {/* Quest Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 40, color: '#ffd700', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {quests.filter((q) => q.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Quests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: '#00a8ff', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {quests.reduce((sum, q) => sum + q.currentParticipants, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Participants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CoinsIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {quests.reduce((sum, q) => sum + q.rewards.dojoCoins, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coins to Distribute
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {quests.filter((q) => q.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Quests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Quests */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Active Quests
          </Typography>

          {quests.filter((q) => q.status === 'active').length === 0 ? (
            <Alert severity="info">
              No active quests. Create your first quest to engage players!
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {quests
                .filter((q) => q.status === 'active')
                .map((quest) => (
                  <Grid item xs={12} md={6} lg={4} key={quest.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Typography variant="h6" component="h3">
                            {quest.title}
                          </Typography>
                          <Chip
                            label={quest.status.toUpperCase()}
                            color={getStatusColor(quest.status)}
                            icon={getStatusIcon(quest.status)}
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {quest.description}
                        </Typography>

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
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>

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

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Quest">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(quest)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Quest">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteQuest(quest.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </Paper>

        {/* All Quests History */}
        {quests.filter((q) => q.status !== 'active').length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Quest History
            </Typography>

            <Grid container spacing={3}>
              {quests
                .filter((q) => q.status !== 'active')
                .map((quest) => (
                  <Grid item xs={12} md={6} lg={4} key={quest.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Typography variant="h6" component="h3">
                            {quest.title}
                          </Typography>
                          <Chip
                            label={quest.status.toUpperCase()}
                            color={getStatusColor(quest.status)}
                            icon={getStatusIcon(quest.status)}
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {quest.description}
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
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        )}

        {/* Create/Edit Quest Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingQuest ? 'Edit Quest' : 'Create New Quest'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Quest Title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Weekend Warrior Challenge"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Quest Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe what players need to do to complete this quest"
                  />
                </Grid>

                {/* Requirements */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Requirements
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.requirements.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          requirements: {
                            ...prev.requirements,
                            type: e.target
                              .value as VenueQuest['requirements']['type'],
                          },
                        }))
                      }
                    >
                      <MenuItem value="wins">Win Games</MenuItem>
                      <MenuItem value="games">Play Games</MenuItem>
                      <MenuItem value="time">Spend Time</MenuItem>
                      <MenuItem value="streak">Winning Streak</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Value"
                    type="number"
                    value={formData.requirements.value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        requirements: {
                          ...prev.requirements,
                          value: parseInt(e.target.value) || 1,
                        },
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Game Type (optional)"
                    value={formData.requirements.gameType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        requirements: {
                          ...prev.requirements,
                          gameType: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g., 8-ball, 9-ball"
                  />
                </Grid>

                {/* Rewards */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Rewards
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dojo Coins"
                    type="number"
                    value={formData.rewards.dojoCoins}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rewards: {
                          ...prev.rewards,
                          dojoCoins: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="XP Points"
                    type="number"
                    value={formData.rewards.xp}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rewards: {
                          ...prev.rewards,
                          xp: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </Grid>

                {/* Duration and Participants */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Quest Settings
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duration (days)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 7,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Participants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxParticipants: parseInt(e.target.value) || 50,
                      }))
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.title || !formData.description}
            >
              {editingQuest ? 'Update Quest' : 'Create Quest'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default VenueQuestsPage;
