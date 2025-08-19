import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { AutoAwesome, ContentCopy, Edit, Close } from '@mui/icons-material';

interface UseThisPromptButtonProps {
  originalPrompt: string;
  originalStyle: 'realistic' | 'cartoon' | 'artistic' | 'cyberpunk';
  originalCategory: string;
  userId: string;
  avatarId: string;
  onTextureGenerated?: (generationId: string) => void;
  variant?: 'button' | 'chip' | 'icon';
  size?: 'small' | 'medium' | 'large';
}

const UseThisPromptButton: React.FC<UseThisPromptButtonProps> = ({
  originalPrompt,
  originalStyle,
  originalCategory,
  userId,
  avatarId,
  onTextureGenerated,
  variant = 'button',
  size = 'medium',
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(originalPrompt);
  const [style, setStyle] = useState<
    'realistic' | 'cartoon' | 'artistic' | 'cyberpunk'
  >(originalStyle);
  const [resolution, setResolution] = useState<
    '512x512' | '1024x1024' | '2048x2048'
  >('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!isGenerating) {
      setOpen(false);
      setPrompt(originalPrompt);
      setStyle(originalStyle);
      setResolution('1024x1024');
      setError(null);
      setSuccess(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(originalPrompt);
    // Could add a toast notification here
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

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
        setSuccess(true);
        if (onTextureGenerated) {
          onTextureGenerated(data.generationId);
        }

        // Close dialog after a short delay
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to generate texture');
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to generate texture'
      );
    } finally {
      setIsGenerating(false);
    }
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

  const renderTrigger = () => {
    const commonProps = {
      onClick: handleOpen,
      disabled: isGenerating,
    };

    switch (variant) {
      case 'chip':
        return (
          <Chip
            {...commonProps}
            icon={<AutoAwesome />}
            label="Use This Prompt"
            size={size}
            sx={{
              backgroundColor: alpha(neonColors.primary, 0.1),
              color: neonColors.primary,
              border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
              '&:hover': {
                backgroundColor: alpha(neonColors.primary, 0.2),
              },
            }}
          />
        );

      case 'icon':
        return (
          <Button
            {...commonProps}
            variant="outlined"
            size={size}
            sx={{
              minWidth: 'auto',
              p: 1,
              borderColor: alpha(neonColors.primary, 0.3),
              color: neonColors.primary,
              '&:hover': {
                borderColor: neonColors.primary,
                backgroundColor: alpha(neonColors.primary, 0.1),
              },
            }}
          >
            <AutoAwesome />
          </Button>
        );

      default:
        return (
          <Button
            {...commonProps}
            variant="contained"
            size={size}
            startIcon={<AutoAwesome />}
            sx={{
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                background: `linear-gradient(45deg, ${neonColors.secondary} 30%, ${neonColors.primary} 90%)`,
              },
            }}
          >
            Use This Prompt
          </Button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(neonColors.primary, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
            borderRadius: 2,
            boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.2)}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: neonColors.primary,
            fontWeight: 'bold',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome />
            Generate with This Prompt
          </Box>
          <Button
            onClick={handleClose}
            disabled={isGenerating}
            sx={{
              minWidth: 'auto',
              p: 0.5,
              color: theme.palette.text.secondary,
            }}
          >
            <Close />
          </Button>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Texture generation started! Check your generations panel for
              progress.
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{ mb: 1, color: theme.palette.text.secondary }}
            >
              Original Prompt:
            </Typography>
            <Box
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, fontStyle: 'italic' }}>
                &ldquo;{originalPrompt}&rdquo;
              </Typography>
              <Button
                size="small"
                onClick={handleCopyPrompt}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <ContentCopy fontSize="small" />
              </Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Chip
                size="small"
                label={originalStyle}
                sx={{
                  backgroundColor: alpha(getStyleColor(originalStyle), 0.2),
                  color: getStyleColor(originalStyle),
                }}
              />
              <Chip
                size="small"
                label={originalCategory}
                sx={{
                  backgroundColor: alpha(neonColors.info, 0.2),
                  color: neonColors.info,
                }}
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Customize Your Prompt"
            placeholder="Edit the prompt or use it as-is..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            sx={{ mb: 2 }}
            helperText="You can modify the original prompt to better suit your needs"
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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

            <FormControl fullWidth>
              <InputLabel>Resolution</InputLabel>
              <Select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                disabled={isGenerating}
              >
                <MenuItem value="512x512">512×512 (Fast)</MenuItem>
                <MenuItem value="1024x1024">1024×1024 (Balanced)</MenuItem>
                <MenuItem value="2048x2048">2048×2048 (High Quality)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              p: 2,
              backgroundColor: alpha(neonColors.info, 0.05),
              borderRadius: 1,
              border: `1px solid ${alpha(neonColors.info, 0.2)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: neonColors.info, fontWeight: 'bold', mb: 1 }}
            >
              💡 Pro Tips:
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}
            >
              • Add descriptive adjectives to enhance the original prompt
              <br />
              • Try different styles to see how they affect the result
              <br />
              • Higher resolutions take longer but provide better quality
              <br />• You can always generate multiple variations
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={handleClose}
            disabled={isGenerating}
            sx={{ color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            variant="contained"
            startIcon={
              isGenerating ? <CircularProgress size={16} /> : <AutoAwesome />
            }
            sx={{
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                background: `linear-gradient(45deg, ${neonColors.secondary} 30%, ${neonColors.primary} 90%)`,
              },
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Texture'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UseThisPromptButton;
