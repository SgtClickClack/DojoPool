import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ImageList,
  ImageListItem,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Palette,
  PhotoLibrary,
  Edit,
  Add,
  AutoAwesome,
  Style,
  MusicNote,
  Lightbulb,
  Business,
  CheckCircle,
  Error,
  Image,
  Refresh,
  Download,
  Visibility,
} from '@mui/icons-material';
import {
  DojoProfileCustomizationService,
  type CustomizationConfig,
  type TextToImageResponse,
} from '../../services/venue/DojoProfileCustomizationService';

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
      id={`customization-tabpanel-${index}`}
      aria-labelledby={`customization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DojoProfileCustomization: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [customization, setCustomization] =
    useState<CustomizationConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [venueId, setVenueId] = useState('neon-futuristic');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<TextToImageResponse[]>(
    []
  );
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] =
    useState<TextToImageResponse | null>(null);

  const service = DojoProfileCustomizationService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      const config = service.getCustomization(venueId);
      setCustomization(config);
      setIsConnected(service.getConnectionStatus());
      setGeneratedImages(service.getGeneratedImages());
    }, 2000);

    // Listen for image generation events
    service.on('imageGenerated', (image: TextToImageResponse) => {
      setGeneratedImages((prev) => [
        ...prev.filter((img) => img.id !== image.id),
        image,
      ]);
    });

    service.on(
      'imageGenerationFailed',
      (data: { id: string; error: string }) => {
        console.error('Image generation failed:', data.error);
      }
    );

    return () => {
      clearInterval(interval);
      service.removeAllListeners();
    };
  }, [service, venueId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateFromText = async (type: string, description: string) => {
    setGenerating(true);
    try {
      switch (type) {
        case 'theme':
          const theme = await service.generateThemeFromText(description);
          service.updateTheme(venueId, theme);
          break;
        case 'attributes':
          const attributes =
            await service.generateAttributesFromText(description);
          attributes.forEach((attr) => service.addAttribute(venueId, attr));
          break;
        case 'gallery':
          const gallery = await service.generateGalleryFromText(description);
          gallery.forEach((item) => service.addGalleryItem(venueId, item));
          break;
        case 'story':
          const story = await service.generateStoryFromText(description);
          service.addStory(venueId, story);
          break;
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleImageClick = (image: TextToImageResponse) => {
    setSelectedImage(image);
    setImageDialogOpen(true);
  };

  const renderThemeTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
              AI Theme Generation
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Describe your venue's atmosphere, style, and vibe..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() =>
                handleGenerateFromText('theme', 'modern futuristic pool venue')
              }
              disabled={generating}
              sx={{ bgcolor: '#00ff9d', color: '#000' }}
            >
              {generating ? 'Generating...' : 'Generate Theme'}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {customization?.theme && (
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                Current Theme
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Name: {customization.theme.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Font: {customization.theme.fontFamily}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: customization.theme.primaryColor,
                    borderRadius: 1,
                  }}
                />
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: customization.theme.secondaryColor,
                    borderRadius: 1,
                  }}
                />
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: customization.theme.accentColor,
                    borderRadius: 1,
                  }}
                />
              </Box>
              {customization.theme.logoUrl && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    Generated Logo:
                  </Typography>
                  <img
                    src={customization.theme.logoUrl}
                    alt="Generated Logo"
                    style={{ width: 100, height: 100, objectFit: 'contain' }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
              Generated Images
            </Typography>
            {generatedImages.length > 0 ? (
              <ImageList
                sx={{ width: '100%', height: 200 }}
                cols={4}
                rowHeight={164}
              >
                {generatedImages.map((image) => (
                  <ImageListItem key={image.id}>
                    <Box sx={{ position: 'relative' }}>
                      {image.status === 'generating' ? (
                        <Box
                          sx={{
                            width: '100%',
                            height: 164,
                            bgcolor: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CircularProgress
                            size={40}
                            sx={{ color: '#00ff9d' }}
                          />
                        </Box>
                      ) : (
                        <img
                          src={image.thumbnailUrl || image.imageUrl}
                          alt={image.prompt}
                          loading="lazy"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleImageClick(image)}
                        />
                      )}
                      <Chip
                        label={image.status}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor:
                            image.status === 'completed'
                              ? '#00ff9d'
                              : '#ff6b6b',
                          color: '#000',
                        }}
                      />
                    </Box>
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Typography variant="body2" sx={{ color: '#888' }}>
                No images generated yet. Use the AI generation tools above to
                create custom images.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAttributesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
              Venue Attributes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Describe your venue's unique features and amenities..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() =>
                handleGenerateFromText(
                  'attributes',
                  'modern tournament pool venue'
                )
              }
              disabled={generating}
              sx={{ bgcolor: '#00ff9d', color: '#000' }}
            >
              {generating ? 'Generating...' : 'Generate Attributes'}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {customization?.attributes && customization.attributes.length > 0 && (
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                Generated Attributes
              </Typography>
              <Grid container spacing={2}>
                {customization.attributes.map((attr) => (
                  <Grid item xs={12} sm={6} md={4} key={attr.id}>
                    <Card sx={{ bgcolor: '#333', border: '1px solid #555' }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{ color: '#00ff9d', mb: 1 }}
                        >
                          {attr.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#fff', mb: 1 }}
                        >
                          {attr.description}
                        </Typography>
                        <Chip
                          label={attr.category}
                          size="small"
                          sx={{ bgcolor: '#00a8ff', color: '#000' }}
                        />
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
  );

  const renderAtmosphereTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00ff9d', mb: 3 }}>
              Atmosphere Settings
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: '#888' }}>Lighting</InputLabel>
              <Select
                value={customization?.atmosphere.lighting || 'ambient'}
                onChange={(e) =>
                  service.updateAtmosphere(venueId, {
                    lighting: e.target.value,
                  })
                }
                sx={{ color: '#fff' }}
              >
                <MenuItem value="ambient">Ambient</MenuItem>
                <MenuItem value="neon">Neon</MenuItem>
                <MenuItem value="warm">Warm</MenuItem>
                <MenuItem value="cool">Cool</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: '#888' }}>Music</InputLabel>
              <Select
                value={customization?.atmosphere.music || 'electronic'}
                onChange={(e) =>
                  service.updateAtmosphere(venueId, { music: e.target.value })
                }
                sx={{ color: '#fff' }}
              >
                <MenuItem value="electronic">Electronic</MenuItem>
                <MenuItem value="rock">Rock</MenuItem>
                <MenuItem value="jazz">Jazz</MenuItem>
                <MenuItem value="ambient">Ambient</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: '#888' }}>Decor</InputLabel>
              <Select
                value={customization?.atmosphere.decor || 'modern'}
                onChange={(e) =>
                  service.updateAtmosphere(venueId, { decor: e.target.value })
                }
                sx={{ color: '#fff' }}
              >
                <MenuItem value="modern">Modern</MenuItem>
                <MenuItem value="vintage">Vintage</MenuItem>
                <MenuItem value="industrial">Industrial</MenuItem>
                <MenuItem value="luxury">Luxury</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: '#888' }}>Vibe</InputLabel>
              <Select
                value={customization?.atmosphere.vibe || 'energetic'}
                onChange={(e) =>
                  service.updateAtmosphere(venueId, { vibe: e.target.value })
                }
                sx={{ color: '#fff' }}
              >
                <MenuItem value="energetic">Energetic</MenuItem>
                <MenuItem value="relaxed">Relaxed</MenuItem>
                <MenuItem value="competitive">Competitive</MenuItem>
                <MenuItem value="social">Social</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00a8ff', mb: 3 }}>
              Atmosphere Preview
            </Typography>

            {customization?.atmosphere && (
              <Box>
                <Typography
                  variant="h5"
                  sx={{ color: '#00ff9d', mb: 2, fontStyle: 'italic' }}
                >
                  {customization.atmosphere.vibe.charAt(0).toUpperCase() +
                    customization.atmosphere.vibe.slice(1)}{' '}
                  Atmosphere
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={customization.atmosphere.lighting}
                    sx={{ bgcolor: '#333', color: '#00a8ff' }}
                  />
                  <Chip
                    label={customization.atmosphere.music}
                    sx={{ bgcolor: '#333', color: '#00a8ff' }}
                  />
                  <Chip
                    label={customization.atmosphere.decor}
                    sx={{ bgcolor: '#333', color: '#00a8ff' }}
                  />
                </Box>

                <Typography variant="body1" sx={{ color: '#fff' }}>
                  Experience the perfect blend of{' '}
                  {customization.atmosphere.lighting} lighting,
                  {customization.atmosphere.music} music, and{' '}
                  {customization.atmosphere.decor} decor for an{' '}
                  {customization.atmosphere.vibe} gaming environment.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBrandingTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00ff9d', mb: 3 }}>
              Branding Information
            </Typography>

            <TextField
              fullWidth
              label="Tagline"
              value={customization?.branding.tagline || ''}
              onChange={(e) =>
                service.updateBranding(venueId, { tagline: e.target.value })
              }
              sx={{ mb: 3 }}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#888' } }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mission Statement"
              value={customization?.branding.mission || ''}
              onChange={(e) =>
                service.updateBranding(venueId, { mission: e.target.value })
              }
              sx={{ mb: 3 }}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#888' } }}
            />

            <TextField
              fullWidth
              label="Core Values (comma-separated)"
              value={customization?.branding.values?.join(', ') || ''}
              onChange={(e) =>
                service.updateBranding(venueId, {
                  values: e.target.value.split(',').map((v) => v.trim()),
                })
              }
              sx={{ mb: 3 }}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#888' } }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00a8ff', mb: 3 }}>
              Brand Preview
            </Typography>

            {customization?.branding && (
              <Box>
                <Typography
                  variant="h5"
                  sx={{ color: '#00ff9d', mb: 2, fontStyle: 'italic' }}
                >
                  "{customization.branding.tagline}"
                </Typography>

                <Typography variant="body1" sx={{ color: '#fff', mb: 3 }}>
                  {customization.branding.mission}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {customization.branding.values?.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      sx={{ bgcolor: '#333', color: '#00a8ff' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ color: '#00ff9d' }}
        >
          Dojo Profile Customization
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#00a8ff', mb: 2 }}>
          Customize your venue's digital presence with AI-powered text-to-image
          generation
        </Typography>

        <Alert
          severity={isConnected ? 'success' : 'error'}
          sx={{ mb: 2 }}
          icon={isConnected ? <CheckCircle /> : <Error />}
        >
          {isConnected
            ? 'Connected to customization service'
            : 'Disconnected from customization service'}
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
          <Tab label="Themes" icon={<Palette />} iconPosition="start" />
          <Tab label="Attributes" icon={<AutoAwesome />} iconPosition="start" />
          <Tab label="Atmosphere" icon={<MusicNote />} iconPosition="start" />
          <Tab label="Branding" icon={<Business />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderThemeTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderAttributesTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderAtmosphereTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {renderBrandingTab()}
      </TabPanel>

      {/* Image Preview Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#00ff9d' }}>
          Generated Image Preview
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                style={{ width: '100%', height: 'auto', borderRadius: 8 }}
              />
              <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
                <strong>Prompt:</strong> {selectedImage.prompt}
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                <strong>Style:</strong> {selectedImage.style}
              </Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                <strong>Status:</strong> {selectedImage.status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setImageDialogOpen(false)}
            sx={{ color: '#00ff9d' }}
          >
            Close
          </Button>
          <Button
            startIcon={<Download />}
            onClick={() => {
              if (selectedImage) {
                window.open(selectedImage.imageUrl, '_blank');
              }
            }}
            sx={{ color: '#00ff9d' }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DojoProfileCustomization;
