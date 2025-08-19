import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AutoAwesome,
  Refresh,
  Download,
  Share,
  Favorite,
  FavoriteBorder,
  Palette,
  Settings,
  History,
} from '@mui/icons-material';

interface TextureGenerationPanelProps {
  userId: string;
  avatarId: string;
  onTextureGenerated?: (textureUrl: string) => void;
}

interface GenerationResult {
  id: string;
  textureUrl: string;
  thumbnailUrl: string;
  prompt: string;
  style: string;
  resolution: string;
  status: 'generating' | 'completed' | 'failed';
  processingTime?: number;
}

interface PopularPrompt {
  prompt: string;
  count: number;
}

const TextureGenerationPanel: React.FC<TextureGenerationPanelProps> = ({
  userId,
  avatarId,
  onTextureGenerated,
}) => {
  const theme = useTheme();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<
    'realistic' | 'cartoon' | 'artistic' | 'cyberpunk'
  >('realistic');
  const [resolution, setResolution] = useState<
    '512x512' | '1024x1024' | '2048x2048'
  >('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] =
    useState<GenerationResult | null>(null);
  const [popularPrompts, setPopularPrompts] = useState<PopularPrompt[]>([]);
  const [userGenerations, setUserGenerations] = useState<GenerationResult[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
  };

  useEffect(() => {
    loadPopularPrompts();
    loadUserGenerations();
  }, [userId]);

  const loadPopularPrompts = async () => {
    try {
      const response = await fetch('/api/texture-ai/popular-prompts?limit=8');
      const data = await response.json();
      if (data.success) {
        setPopularPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Failed to load popular prompts:', error);
    }
  };

  const loadUserGenerations = async () => {
    try {
      const response = await fetch(
        `/api/texture-ai/user/${userId}/generations?limit=6`
      );
      const data = await response.json();
      if (data.success) {
        setUserGenerations(data.generations);
      }
    } catch (error) {
      console.error('Failed to load user generations:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a texture prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentGeneration(null);

    try {
      const response = await fetch('/api/texture-ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          userId,
          avatarId,
          style,
          resolution,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Start polling for results
        pollForResult(data.generationId);
      } else {
        throw new Error(data.error || 'Failed to start generation');
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to generate texture'
      );
      setIsGenerating(false);
    }
  };

  const pollForResult = async (generationId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/texture-ai/result/${generationId}`);
        const data = await response.json();

        if (data.success && data.result) {
          setCurrentGeneration(data.result);

          if (data.result.status === 'completed') {
            setIsGenerating(false);
            if (onTextureGenerated) {
              onTextureGenerated(data.result.textureUrl);
            }
            loadUserGenerations(); // Refresh user generations
            return;
          } else if (data.result.status === 'failed') {
            setError('Texture generation failed');
            setIsGenerating(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setError('Generation timeout - please try again');
          setIsGenerating(false);
        }
      } catch (error) {
        setError('Failed to check generation status');
        setIsGenerating(false);
      }
    };

    poll();
  };

  const handlePromptClick = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const getStyleColor = (styleName: string) => {
    switch (styleName) {
      case 'realistic':
        return neonColors.primary;
      case 'cartoon':
        return neonColors.warning;
      case 'artistic':
        return neonColors.purple;
      case 'cyberpunk':
        return neonColors.secondary;
      default:
        return neonColors.info;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 'bold',
          background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}
      >
        <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI Texture Generation
      </Typography>

      <Grid container spacing={3}>
        {/* Main Generation Panel */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(neonColors.primary, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
              borderRadius: 2,
              boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.2)}`,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: neonColors.primary }}
              >
                <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
                Create Custom Texture
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Describe your texture"
                placeholder="e.g., cyberpunk neon texture with glowing circuits, metallic surface with holographic patterns..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                sx={{ mb: 2 }}
                disabled={isGenerating}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Style</InputLabel>
                    <Select
                      value={style}
                      onChange={(e) => setStyle(e.target.value as any)}
                      disabled={isGenerating}
                    >
                      <MenuItem value="realistic">Realistic</MenuItem>
                      <MenuItem value="cartoon">Cartoon</MenuItem>
                      <MenuItem value="artistic">Artistic</MenuItem>
                      <MenuItem value="cyberpunk">Cyberpunk</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Resolution</InputLabel>
                    <Select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      disabled={isGenerating}
                    >
                      <MenuItem value="512x512">512×512 (Fast)</MenuItem>
                      <MenuItem value="1024x1024">
                        1024×1024 (Balanced)
                      </MenuItem>
                      <MenuItem value="2048x2048">
                        2048×2048 (High Quality)
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                sx={{
                  background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
                  color: 'white',
                  fontWeight: 'bold',
                  py: 1.5,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${neonColors.secondary} 30%, ${neonColors.primary} 90%)`,
                  },
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Texture'}
              </Button>

              {isGenerating && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    sx={{
                      backgroundColor: alpha(neonColors.primary, 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: neonColors.primary,
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      textAlign: 'center',
                      color: neonColors.primary,
                    }}
                  >
                    {currentGeneration?.status === 'generating'
                      ? 'AI is creating your texture...'
                      : 'Preparing generation...'}
                  </Typography>
                </Box>
              )}

              {currentGeneration?.status === 'completed' && (
                <Paper
                  sx={{
                    mt: 2,
                    p: 2,
                    background: alpha(neonColors.primary, 0.1),
                    border: `1px solid ${neonColors.primary}`,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 1, color: neonColors.primary }}
                  >
                    Generated Texture
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <img
                      src={currentGeneration.thumbnailUrl}
                      alt="Generated texture"
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Prompt:</strong> {currentGeneration.prompt}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Style:</strong> {currentGeneration.style} |{' '}
                        <strong>Resolution:</strong>{' '}
                        {currentGeneration.resolution}
                      </Typography>
                      {currentGeneration.processingTime && (
                        <Typography
                          variant="body2"
                          sx={{ color: neonColors.info }}
                        >
                          Generated in{' '}
                          {(currentGeneration.processingTime / 1000).toFixed(1)}
                          s
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Tooltip title="Download Texture">
                        <IconButton sx={{ color: neonColors.primary }}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share">
                        <IconButton sx={{ color: neonColors.secondary }}>
                          <Share />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Popular Prompts */}
          <Card
            sx={{
              mb: 2,
              background: alpha(theme.palette.background.paper, 0.95),
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: neonColors.warning }}
              >
                <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                Popular Prompts
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {popularPrompts.map((item, index) => (
                  <Chip
                    key={index}
                    label={item.prompt}
                    onClick={() => handlePromptClick(item.prompt)}
                    sx={{
                      backgroundColor: alpha(neonColors.warning, 0.1),
                      color: neonColors.warning,
                      border: `1px solid ${alpha(neonColors.warning, 0.3)}`,
                      '&:hover': {
                        backgroundColor: alpha(neonColors.warning, 0.2),
                      },
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Recent Generations */}
          <Card
            sx={{ background: alpha(theme.palette.background.paper, 0.95) }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: neonColors.info }}>
                <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your Recent Textures
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {userGenerations.map((generation) => (
                  <Paper
                    key={generation.id}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      background: alpha(neonColors.info, 0.05),
                      border: `1px solid ${alpha(neonColors.info, 0.2)}`,
                    }}
                  >
                    <img
                      src={generation.thumbnailUrl}
                      alt="Generated texture"
                      style={{ width: 40, height: 40, borderRadius: 4 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {generation.prompt}
                      </Typography>
                      <Chip
                        size="small"
                        label={generation.style}
                        sx={{
                          backgroundColor: alpha(
                            getStyleColor(generation.style),
                            0.2
                          ),
                          color: getStyleColor(generation.style),
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TextureGenerationPanel;
