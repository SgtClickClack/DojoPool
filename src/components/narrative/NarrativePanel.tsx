import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Grid,
  Paper,
  Badge,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Book as StoryIcon,
  Person as CharacterIcon,
  LocationOn as LocationIcon,
  EmojiEvents as AchievementIcon,
  AutoAwesome as EffectIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Chat as ChatIcon,
  Explore as ExploreIcon
} from '@mui/icons-material';
import { NarrativeEventSystem, Character, StoryArc, WorldState } from '../../services/narrative/NarrativeEventSystem';

interface NarrativePanelProps {
  userId: string;
  onClose?: () => void;
}

const NarrativePanel: React.FC<NarrativePanelProps> = ({ userId, onClose }) => {
  const [narrativeSystem] = useState(() => NarrativeEventSystem.getInstance());
  const [characters, setCharacters] = useState<Character[]>([]);
  const [storyArcs, setStoryArcs] = useState<StoryArc[]>([]);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedStoryArc, setSelectedStoryArc] = useState<StoryArc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDialogue, setCurrentDialogue] = useState<{
    character: Character;
    content: string;
    emotion: string;
  } | null>(null);

  useEffect(() => {
    loadNarrativeState();
  }, [userId]);

  const loadNarrativeState = async () => {
    try {
      setIsLoading(true);
      const allCharacters = narrativeSystem.getAllCharacters();
      const activeArcs = narrativeSystem.getActiveStoryArcs(userId);
      const world = narrativeSystem.getWorldState();

      setCharacters(allCharacters);
      setStoryArcs(activeArcs);
      setWorldState(world);
    } catch (error) {
      console.error('Error loading narrative state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setCharacterDialogOpen(true);
  };

  const handleStoryArcClick = (arc: StoryArc) => {
    setSelectedStoryArc(arc);
    setStoryDialogOpen(true);
  };

  const triggerGameEvent = async (eventType: string, eventData: any) => {
    try {
      await narrativeSystem.processGameEvent(userId, eventType, eventData);
      await loadNarrativeState(); // Reload state after event
    } catch (error) {
      console.error('Error triggering game event:', error);
    }
  };

  const startStoryArc = async (arcId: string) => {
    await triggerGameEvent('story_arc_start', { arcId });
  };

  const advanceStoryArc = async (arcId: string) => {
    await triggerGameEvent('story_arc_advance', { arcId });
  };

  const interactWithCharacter = async (character: Character) => {
    try {
      await triggerGameEvent('character_interaction', {
        characterId: character.id,
        characterName: character.name,
        location: worldState?.currentLocation
      });

      // Find appropriate dialogue
      const dialogue = character.dialogue[0];
      if (dialogue) {
        setCurrentDialogue({
          character,
          content: dialogue.content,
          emotion: dialogue.emotion
        });
      }
    } catch (error) {
      console.error('Error interacting with character:', error);
    }
  };

  const changeLocation = async (newLocation: string) => {
    await triggerGameEvent('location_change', { location: newLocation });
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'friendly': return 'success';
      case 'hostile': return 'error';
      case 'excited': return 'warning';
      case 'sad': return 'info';
      default: return 'default';
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'friend': return 'success';
      case 'rival': return 'error';
      case 'mentor': return 'info';
      case 'enemy': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxHeight: '80vh', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'primary.main' }}>
          Narrative World
        </Typography>
        {onClose && (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* World State */}
      {worldState && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
              World State
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">
                    Location: {worldState.currentLocation.replace('_', ' ')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Time: {worldState.timeOfDay}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  Weather: {worldState.weather}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => changeLocation('dojo_training_room')}
                  sx={{ mr: 1 }}
                >
                  Go to Training Room
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => changeLocation('underground_club')}
                  sx={{ mr: 1 }}
                >
                  Go to Underground Club
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => changeLocation('casual_bar')}
                >
                  Go to Casual Bar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Story Arcs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
            Story Arcs
          </Typography>
          {storyArcs.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No active story arcs. Start your journey!
            </Alert>
          ) : (
            <List>
              {storyArcs.map((arc) => (
                <ListItem key={arc.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: arc.isActive ? 'primary.main' : 'grey.500' }}>
                      <StoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={arc.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {arc.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Chapter {arc.currentChapter + 1} / {arc.chapters.length}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={((arc.currentChapter + (arc.isCompleted ? 1 : 0)) / arc.chapters.length) * 100}
                          sx={{ mt: 1, height: 4 }}
                        />
                      </Box>
                    }
                  />
                  <Box>
                    <Button
                      size="small"
                      onClick={() => handleStoryArcClick(arc)}
                      sx={{ mr: 1 }}
                    >
                      <ViewIcon />
                    </Button>
                    {!arc.isCompleted && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => advanceStoryArc(arc.id)}
                      >
                        <PlayIcon />
                      </Button>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
          
          {/* Available Story Arcs */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'secondary.main' }}>
            Available Arcs
          </Typography>
          <Button
            variant="outlined"
            onClick={() => startStoryArc('the_beginning')}
            sx={{ mr: 1 }}
          >
            Start: The Beginning
          </Button>
          <Button
            variant="outlined"
            onClick={() => startStoryArc('rival_rising')}
          >
            Start: Rival Rising
          </Button>
        </CardContent>
      </Card>

      {/* Characters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
            Characters
          </Typography>
          <Grid container spacing={2}>
            {characters.map((character) => (
              <Grid item xs={12} sm={6} md={4} key={character.id}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    border: character.currentLocation === worldState?.currentLocation ? 2 : 1,
                    borderColor: character.currentLocation === worldState?.currentLocation ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handleCharacterClick(character)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar src={character.avatar} sx={{ mr: 1 }}>
                      <CharacterIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {character.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {character.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={character.relationship}
                    size="small"
                    color={getRelationshipColor(character.relationship) as any}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {character.currentLocation?.replace('_', ' ')}
                  </Typography>
                  {character.currentLocation === worldState?.currentLocation && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<ChatIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        interactWithCharacter(character);
                      }}
                    >
                      Interact
                    </Button>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Character Dialog */}
      <Dialog
        open={characterDialogOpen}
        onClose={() => setCharacterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={selectedCharacter?.avatar} sx={{ mr: 2 }}>
              <CharacterIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedCharacter?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCharacter?.title}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedCharacter?.personality}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedCharacter?.backstory}
          </Typography>
          <Chip
            label={selectedCharacter?.relationship}
            color={getRelationshipColor(selectedCharacter?.relationship || 'neutral') as any}
            sx={{ mb: 2 }}
          />
          {selectedCharacter?.currentLocation === worldState?.currentLocation && (
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => {
                interactWithCharacter(selectedCharacter!);
                setCharacterDialogOpen(false);
              }}
            >
              Interact
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCharacterDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Story Arc Dialog */}
      <Dialog
        open={storyDialogOpen}
        onClose={() => setStoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StoryIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">{selectedStoryArc?.title}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedStoryArc?.description}
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Chapters
          </Typography>
          {selectedStoryArc?.chapters.map((chapter, index) => (
            <Box key={chapter.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Chapter {index + 1}: {chapter.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {chapter.description}
              </Typography>
              <Chip
                label={chapter.isCompleted ? 'Completed' : 'In Progress'}
                color={chapter.isCompleted ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          ))}
          {selectedStoryArc?.rewards && selectedStoryArc.rewards.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Rewards
              </Typography>
              {selectedStoryArc.rewards.map((reward, index) => (
                <Chip
                  key={index}
                  label={reward.description}
                  icon={<AchievementIcon />}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectedStoryArc && !selectedStoryArc.isCompleted && (
            <Button
              variant="contained"
              onClick={() => {
                advanceStoryArc(selectedStoryArc.id);
                setStoryDialogOpen(false);
              }}
            >
              Advance Story
            </Button>
          )}
          <Button onClick={() => setStoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Current Dialogue */}
      {currentDialogue && (
        <Dialog
          open={!!currentDialogue}
          onClose={() => setCurrentDialogue(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={currentDialogue.character.avatar} sx={{ mr: 2 }}>
                <CharacterIcon />
              </Avatar>
              <Typography variant="h6">{currentDialogue.character.name}</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {currentDialogue.content}
            </Typography>
            <Chip
              label={currentDialogue.emotion}
              color={getEmotionColor(currentDialogue.emotion) as any}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCurrentDialogue(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default NarrativePanel; 