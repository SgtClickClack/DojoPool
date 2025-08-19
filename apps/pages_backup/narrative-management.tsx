import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Paper,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Book as StoryIcon,
  Person as AvatarIcon,
  EmojiEvents as AchievementIcon,
  AutoAwesome as EffectIcon,
  LocationOn as LocationIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import NarrativePanel from '../components/narrative/NarrativePanel';
import AvatarProgression from '../components/avatar/AvatarProgression';

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
      id={`narrative-tabpanel-${index}`}
      aria-labelledby={`narrative-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const NarrativeManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userId] = useState('demo_user_123');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const demoEvents = [
    {
      id: 'tutorial_complete',
      title: 'Tutorial Complete',
      description:
        'Complete the basic tutorial to unlock your first avatar features',
      type: 'achievement',
      status: 'completed',
    },
    {
      id: 'first_win',
      title: 'First Victory',
      description: 'Win your first match to advance your story',
      type: 'game_event',
      status: 'available',
    },
    {
      id: 'rival_encounter',
      title: 'Rival Encounter',
      description: 'Meet your mysterious rival at the underground club',
      type: 'story_event',
      status: 'locked',
    },
  ];

  const demoCharacters = [
    {
      id: 'master_li',
      name: 'Master Li',
      title: 'The Wise Mentor',
      location: 'dojo_training_room',
      relationship: 'mentor',
      status: 'available',
    },
    {
      id: 'shadow_player',
      name: 'The Shadow',
      title: 'Mysterious Rival',
      location: 'underground_club',
      relationship: 'rival',
      status: 'locked',
    },
    {
      id: 'lucky_lucy',
      name: 'Lucky Lucy',
      title: 'The Fluke Master',
      location: 'casual_bar',
      relationship: 'friend',
      status: 'available',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'available':
        return 'primary';
      case 'locked':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'friend':
        return 'success';
      case 'rival':
        return 'error';
      case 'mentor':
        return 'info';
      case 'enemy':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ color: 'primary.main', mb: 4 }}
          >
            Narrative & Avatar Progression System
          </Typography>

          <Alert severity="info" sx={{ mb: 4 }}>
            Experience the immersive narrative-driven progression system where
            your pool skills unlock story arcs, character interactions, and
            avatar evolution. Every match, every victory, and every interaction
            shapes your journey.
          </Alert>

          <Paper sx={{ width: '100%', mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="narrative system tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<StoryIcon />}
                label="Narrative World"
                iconPosition="start"
              />
              <Tab
                icon={<AvatarIcon />}
                label="Avatar Progression"
                iconPosition="start"
              />
              <Tab
                icon={<AchievementIcon />}
                label="Story Events"
                iconPosition="start"
              />
              <Tab
                icon={<ChatIcon />}
                label="Character Interactions"
                iconPosition="start"
              />
            </Tabs>

            {/* Narrative World Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ color: 'secondary.main', mb: 3 }}
              >
                Interactive Narrative World
              </Typography>
              <NarrativePanel userId={userId} />
            </TabPanel>

            {/* Avatar Progression Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ color: 'secondary.main', mb: 3 }}
              >
                Avatar Evolution & Features
              </Typography>
              <AvatarProgression userId={userId} />
            </TabPanel>

            {/* Story Events Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ color: 'secondary.main', mb: 3 }}
              >
                Story Events & Achievements
              </Typography>

              <Grid container spacing={3}>
                {demoEvents.map((event) => (
                  <Grid item xs={12} md={6} lg={4} key={event.id}>
                    <Card
                      sx={{
                        height: '100%',
                        border: event.status === 'completed' ? 2 : 1,
                        borderColor:
                          event.status === 'completed'
                            ? 'success.main'
                            : 'divider',
                      }}
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
                          <Typography variant="h6" component="div">
                            {event.title}
                          </Typography>
                          <Chip
                            label={event.status}
                            color={getStatusColor(event.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {event.description}
                        </Typography>
                        <Chip
                          label={event.type.replace('_', ' ')}
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {event.status === 'available' && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ mt: 2 }}
                          >
                            Trigger Event
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: 'secondary.main', mb: 2 }}
              >
                Event Types
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Achievement Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unlock avatar features and story progress through
                        achievements
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Game Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Match outcomes trigger narrative consequences and
                        character interactions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Story Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Major plot points that advance story arcs and unlock new
                        content
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Location Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Visiting different venues triggers unique narrative
                        experiences
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Character Interactions Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ color: 'secondary.main', mb: 3 }}
              >
                Character Interactions & Relationships
              </Typography>

              <Grid container spacing={3}>
                {demoCharacters.map((character) => (
                  <Grid item xs={12} md={6} lg={4} key={character.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box>
                            <Typography variant="h6" component="div">
                              {character.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {character.title}
                            </Typography>
                          </Box>
                          <Chip
                            label={character.status}
                            color={getStatusColor(character.status) as any}
                            size="small"
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={character.relationship}
                            color={
                              getRelationshipColor(
                                character.relationship
                              ) as any
                            }
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            icon={<LocationIcon />}
                            label={character.location.replace('_', ' ')}
                            variant="outlined"
                            size="small"
                          />
                        </Box>

                        {character.status === 'available' && (
                          <Button
                            variant="contained"
                            startIcon={<ChatIcon />}
                            fullWidth
                          >
                            Interact
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: 'secondary.main', mb: 2 }}
              >
                Character Relationship Types
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Mentors
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Wise characters who guide your progression and unlock
                        advanced features
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Rivals
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Challenging opponents who drive story arcs and test your
                        skills
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Friends
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supportive characters who provide bonuses and unlock
                        social features
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Enemies
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Antagonistic characters who create challenges and story
                        conflicts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>

          {/* System Features Overview */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ color: 'secondary.main' }}
              >
                System Features
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Narrative Features
                  </Typography>
                  <ul>
                    <li>Dynamic story arcs that respond to player actions</li>
                    <li>
                      Character interactions with personality-driven dialogue
                    </li>
                    <li>
                      World state changes based on events and player choices
                    </li>
                    <li>Real-time narrative commentary from Pool Gods</li>
                    <li>
                      Location-based story triggers and character encounters
                    </li>
                  </ul>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Avatar Progression Features
                  </Typography>
                  <ul>
                    <li>Visual avatar evolution based on achievements</li>
                    <li>Unlockable outfits, accessories, and effects</li>
                    <li>Story-driven achievement system</li>
                    <li>Venue mastery with visual rewards</li>
                    <li>Pool God blessings and special effects</li>
                  </ul>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Layout>
  );
};

export default NarrativeManagement;
