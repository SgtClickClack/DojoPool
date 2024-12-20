import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface AvatarStyle {
  name: string;
  base_prompt: string;
  strength: number;
  guidance_scale: number;
  num_inference_steps: number;
}

interface AvatarGeneratorProps {
  onAvatarGenerated: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
}

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

const StyledPreview = styled(Box)(({ theme }) => ({
  width: '256px',
  height: '256px',
  border: `2px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
}));

const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({
  onAvatarGenerated,
  currentAvatarUrl,
}) => {
  const [styles, setStyles] = useState<Record<string, AvatarStyle>>({});
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [strength, setStrength] = useState<number>(0.75);
  const [seed, setSeed] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available avatar styles
    const fetchStyles = async () => {
      try {
        const response = await fetch('/api/avatars/styles');
        if (!response.ok) throw new Error('Failed to fetch styles');
        const data = await response.json();
        setStyles(data);
        if (Object.keys(data).length > 0) {
          setSelectedStyle(Object.keys(data)[0]);
        }
      } catch (err) {
        setError('Failed to load avatar styles');
      }
    };

    fetchStyles();
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/avatars/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: selectedStyle,
          custom_prompt: customPrompt || undefined,
          seed: seed || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate avatar');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onAvatarGenerated(url);
    } catch (err) {
      setError('Failed to generate avatar');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomize = async () => {
    if (!currentAvatarUrl) return;

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/avatars/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: selectedStyle,
          strength,
          seed: seed || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to customize avatar');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onAvatarGenerated(url);
    } catch (err) {
      setError('Failed to customize avatar');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box>
      <StyledCard>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Avatar Generator
            </Typography>

            <Select
              fullWidth
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as string)}
              disabled={isGenerating}
              sx={{ mb: 2 }}
            >
              {Object.entries(styles).map(([key, style]) => (
                <MenuItem key={key} value={key}>
                  {style.name}
                </MenuItem>
              ))}
            </Select>

            <TextField
              fullWidth
              label="Custom Prompt (Optional)"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isGenerating}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <Typography gutterBottom>Customization Strength</Typography>
            <Slider
              value={strength}
              onChange={(_, value) => setStrength(value as number)}
              min={0}
              max={1}
              step={0.05}
              disabled={isGenerating}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Seed (Optional)"
              type="number"
              value={seed || ''}
              onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)}
              disabled={isGenerating}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedStyle}
                fullWidth
              >
                {isGenerating ? <CircularProgress size={24} /> : 'Generate New'}
              </Button>

              {currentAvatarUrl && (
                <Button
                  variant="outlined"
                  onClick={handleCustomize}
                  disabled={isGenerating || !selectedStyle}
                  fullWidth
                >
                  {isGenerating ? <CircularProgress size={24} /> : 'Customize Current'}
                </Button>
              )}
            </Box>

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <StyledPreview>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography color="textSecondary">No preview available</Typography>
              )}
            </StyledPreview>

            {selectedStyle && styles[selectedStyle] && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Style Details
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {styles[selectedStyle].base_prompt}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </StyledCard>
    </Box>
  );
};

export default AvatarGenerator; 