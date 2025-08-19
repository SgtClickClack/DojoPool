import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  ColorPicker,
  ImageList,
  ImageListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Palette,
  MonetizationOn,
  LocalOffer,
  PhotoCamera,
  Edit,
  Add,
  Delete,
  Save,
  Refresh,
  Visibility,
  VisibilityOff,
  ColorLens,
  MusicNote,
  Lightbulb,
  EmojiEvents,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import DojoProfileService, {
  type DojoProfile,
  type VenueTheme,
  type DojoCoinReward,
  type VenueSpecial,
  VenueAtmosphere,
  type VenueStory,
} from '../../services/venue/DojoProfileService';

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
      id={`dojo-profile-tabpanel-${index}`}
      aria-labelledby={`dojo-profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DojoProfileComponent: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<DojoProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [themePrompt, setThemePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] =
    useState<VenueTheme['backgroundStyle']>('cyberpunk');
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showSpecialDialog, setShowSpecialDialog] = useState(false);
  const [showStoryDialog, setShowStoryDialog] = useState(false);

  const profileService = DojoProfileService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      const mockProfile = profileService.getProfile('venue1');
      if (mockProfile) {
        setProfile(mockProfile);
      }
      setIsConnected(profileService.getConnectionStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, [profileService]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateTheme = async () => {
    if (!themePrompt.trim()) return;

    setGeneratingTheme(true);
    try {
      const newTheme = await profileService.generateTheme(
        themePrompt,
        selectedStyle
      );
      if (profile) {
        const updatedProfile = { ...profile, theme: newTheme };
        setProfile(updatedProfile);
        await profileService.updateProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to generate theme:', error);
    } finally {
      setGeneratingTheme(false);
    }
  };

  const handleCreateReward = async (
    reward: Omit<DojoCoinReward, 'id' | 'currentRedemptions'>
  ) => {
    try {
      const newReward = await profileService.createReward(reward);
      if (profile) {
        const updatedProfile = {
          ...profile,
          rewards: [...profile.rewards, newReward],
        };
        setProfile(updatedProfile);
        await profileService.updateProfile(updatedProfile);
      }
      setShowRewardDialog(false);
    } catch (error) {
      console.error('Failed to create reward:', error);
    }
  };

  const handleCreateSpecial = async (special: Omit<VenueSpecial, 'id'>) => {
    try {
      const newSpecial = await profileService.createSpecial(special);
      if (profile) {
        const updatedProfile = {
          ...profile,
          specials: [...profile.specials, newSpecial],
        };
        setProfile(updatedProfile);
        await profileService.updateProfile(updatedProfile);
      }
      setShowSpecialDialog(false);
    } catch (error) {
      console.error('Failed to create special:', error);
    }
  };

  const handleCreateStory = async (
    story: Omit<VenueStory, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const newStory = await profileService.createStory(story);
      if (profile) {
        const updatedProfile = {
          ...profile,
          stories: [...profile.stories, newStory],
        };
        setProfile(updatedProfile);
        await profileService.updateProfile(updatedProfile);
      }
      setShowStoryDialog(false);
    } catch (error) {
      console.error('Failed to create story:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!profile) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ color: '#00ff9d' }}>
          Loading Dojo Profile...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ color: '#00ff9d' }}
        >
          {profile.name} - Dojo Profile
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#00a8ff', mb: 2 }}>
          Customize your venue's appearance, rewards, and special offers
        </Typography>

        <Alert
          severity={isConnected ? 'success' : 'error'}
          sx={{ mb: 2 }}
          icon={isConnected ? <Star /> : <TrendingUp />}
        >
          {isConnected
            ? 'Connected to Dojo Profile service'
            : 'Disconnected from Dojo Profile service'}
        </Alert>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#ffffff',
              '&.Mui-selected': { color: '#00ff9d' },
            },
          }}
        >
          <Tab
            label="Theme & Branding"
            icon={<Palette />}
            iconPosition="start"
          />
          <Tab label="Rewards" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Specials" icon={<LocalOffer />} iconPosition="start" />
          <Tab label="Atmosphere" icon={<Lightbulb />} iconPosition="start" />
          <Tab label="Stories" icon={<PhotoCamera />} iconPosition="start" />
          <Tab label="Settings" icon={<Edit />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  AI Theme Generation
                </Typography>
                <TextField
                  fullWidth
                  label="Describe your venue theme"
                  value={themePrompt}
                  onChange={(e) => setThemePrompt(e.target.value)}
                  placeholder="e.g., Cyberpunk neon-lit pool hall with futuristic atmosphere"
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Style</InputLabel>
                  <Select
                    value={selectedStyle}
                    onChange={(e) =>
                      setSelectedStyle(
                        e.target.value as VenueTheme['backgroundStyle']
                      )
                    }
                  >
                    <MenuItem value="cyberpunk">Cyberpunk</MenuItem>
                    <MenuItem value="modern">Modern</MenuItem>
                    <MenuItem value="classic">Classic</MenuItem>
                    <MenuItem value="neon">Neon</MenuItem>
                    <MenuItem value="minimal">Minimal</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleGenerateTheme}
                  disabled={generatingTheme || !themePrompt.trim()}
                  startIcon={generatingTheme ? <Refresh /> : <Palette />}
                  sx={{ bgcolor: '#00ff9d', color: '#000' }}
                >
                  {generatingTheme ? 'Generating...' : 'Generate Theme'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Current Theme
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    Name: {profile.theme.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    Style: {profile.theme.backgroundStyle}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={`Primary: ${profile.theme.primaryColor}`}
                    sx={{ bgcolor: profile.theme.primaryColor, color: '#000' }}
                  />
                  <Chip
                    label={`Secondary: ${profile.theme.secondaryColor}`}
                    sx={{
                      bgcolor: profile.theme.secondaryColor,
                      color: '#000',
                    }}
                  />
                  <Chip
                    label={`Accent: ${profile.theme.accentColor}`}
                    sx={{ bgcolor: profile.theme.accentColor, color: '#000' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  {profile.theme.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#feca57', mb: 2 }}>
                  Generated Images
                </Typography>
                <ImageList
                  sx={{ width: '100%', height: 200 }}
                  cols={3}
                  rowHeight={164}
                >
                  {profile.theme.generatedImages.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`Generated theme ${index + 1}`}
                        loading="lazy"
                        style={{ borderRadius: '8px' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                Dojo Coin Rewards
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowRewardDialog(true)}
                sx={{ bgcolor: '#00ff9d', color: '#000' }}
              >
                Add Reward
              </Button>
            </Box>
          </Grid>

          {profile.rewards.map((reward) => (
            <Grid item xs={12} md={6} lg={4} key={reward.id}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#00a8ff' }}>
                      {reward.name}
                    </Typography>
                    <Chip
                      label={`${reward.coinAmount} Coins`}
                      sx={{ bgcolor: '#feca57', color: '#000' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    {reward.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={reward.type}
                      size="small"
                      sx={{ bgcolor: '#333' }}
                    />
                    <Chip
                      label={reward.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={reward.isActive ? 'success' : 'default'}
                    />
                  </Box>
                  {reward.maxRedemptions && (
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {reward.currentRedemptions}/{reward.maxRedemptions}{' '}
                      redemptions
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                Venue Specials
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowSpecialDialog(true)}
                sx={{ bgcolor: '#00ff9d', color: '#000' }}
              >
                Add Special
              </Button>
            </Box>
          </Grid>

          {profile.specials.map((special) => (
            <Grid item xs={12} md={6} lg={4} key={special.id}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#feca57', mb: 1 }}>
                    {special.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    {special.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={`${special.discount}% OFF`}
                      sx={{ bgcolor: '#ff6b6b', color: '#fff' }}
                    />
                    <Chip
                      label={special.type.replace('_', ' ')}
                      size="small"
                      sx={{ bgcolor: '#333' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    {special.startTime} - {special.endTime}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888' }}>
                    {special.days.join(', ')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Atmosphere Settings
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Vibe: {profile.atmosphere.vibe}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Lighting: {profile.atmosphere.lighting}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                    Music: {profile.atmosphere.music}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#888' }}>
                  {profile.atmosphere.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Generated Attributes
                </Typography>
                {profile.atmosphere.generatedAttributes.map((attr, index) => (
                  <Chip
                    key={index}
                    label={attr}
                    sx={{ mb: 1, mr: 1, bgcolor: '#333' }}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: '#00ff9d' }}>
                Venue Stories
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowStoryDialog(true)}
                sx={{ bgcolor: '#00ff9d', color: '#000' }}
              >
                Add Story
              </Button>
            </Box>
          </Grid>

          {profile.stories.map((story) => (
            <Grid item xs={12} md={6} key={story.id}>
              <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#feca57' }}>
                      {story.title}
                    </Typography>
                    <Chip
                      label={story.category}
                      size="small"
                      sx={{ bgcolor: '#333' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    {story.content}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={story.isPublic ? 'Public' : 'Private'}
                      size="small"
                      color={story.isPublic ? 'success' : 'default'}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: '#888', alignSelf: 'center' }}
                    >
                      {new Date(story.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Profile Settings
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.settings.publicProfile}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00ff9d',
                          },
                        }}
                      />
                    }
                    label="Public Profile"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.settings.allowReviews}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00ff9d',
                          },
                        }}
                      />
                    }
                    label="Allow Reviews"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.settings.showRewards}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00ff9d',
                          },
                        }}
                      />
                    }
                    label="Show Rewards"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.settings.showSpecials}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00ff9d',
                          },
                        }}
                      />
                    }
                    label="Show Specials"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.settings.autoGenerateContent}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00ff9d',
                          },
                        }}
                      />
                    }
                    label="Auto-Generate Content"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Photo Gallery
                </Typography>
                <ImageList
                  sx={{ width: '100%', height: 200 }}
                  cols={2}
                  rowHeight={164}
                >
                  {profile.photoGallery.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`Venue photo ${index + 1}`}
                        loading="lazy"
                        style={{ borderRadius: '8px' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default DojoProfileComponent;
