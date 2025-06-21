import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  Grid,
  Select,
  MenuItem,
  Slider,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
  Container,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Style as StyleIcon,
  Tune as CustomizeIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Avatar3DPreview from './Avatar3DPreview';
import Avatar3DModelViewer from './Avatar3DModelViewer';
import { avatar3DService, Avatar3DRequest } from '../../../services/avatar3DService';

interface AvatarCreationProps {
  onAvatarCreated?: (avatarUrl: string) => void;
}

const AvatarCreation: React.FC<AvatarCreationProps> = ({ onAvatarCreated }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [model3DUrl, setModel3DUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [strength, setStrength] = useState(0.75);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    // Remove styles, selectedStyle, and mockStyles
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!selectedFile && !customPrompt) {
      setError('Please upload an image or provide a custom prompt');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // Prepare the request for 3D AI Studio
      const request: Avatar3DRequest = {
        format: 'glb',
        prompt: customPrompt || 'cyberpunk pool player avatar'
      };

      // If user uploaded an image, convert to base64
      if (selectedFile) {
        const base64Image = await convertFileToBase64(selectedFile);
        request.image = base64Image;
      }

      // For now, use mock implementation for testing
      // In production, use: const result = await avatar3DService.generateAvatar(request);
      const result = await avatar3DService.generateMockAvatar(request);
      
      if (result.success && result.modelUrl) {
        // Set both the preview image and 3D model URL
        setPreviewUrl(result.modelUrl);
        setModel3DUrl(result.modelUrl);
        
        if (onAvatarCreated) {
          onAvatarCreated(result.modelUrl);
        }
      } else {
        throw new Error(result.error || 'Failed to generate 3D avatar');
      }
      
    } catch (err) {
      console.error('Avatar generation error:', err);
      setError('Failed to generate avatar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!previewUrl || !nickname) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Mock save - in real app this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set success state
      setIsSuccess(true);
      setSuccessMessage(`Avatar "${nickname}" created successfully!`);
      
      // Save avatar data to localStorage
      localStorage.setItem('userAvatar', model3DUrl || previewUrl || '');
      localStorage.setItem('userNickname', nickname);
      localStorage.setItem('avatarJustCreated', 'true');
      if (bio) {
        localStorage.setItem('userBio', bio);
      }
      
      // Dispatch custom event for dashboard to listen to
      const avatarCreatedEvent = new CustomEvent('avatarCreated', {
        detail: {
          avatarUrl: model3DUrl || previewUrl || '',
          nickname: nickname,
          bio: bio
        }
      });
      window.dispatchEvent(avatarCreatedEvent);
      
      // Call the callback to update parent component
      if (onAvatarCreated && model3DUrl) {
        onAvatarCreated(model3DUrl);
      }
      
      // Show success message for 2 seconds before navigating
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Failed to save avatar');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(26, 26, 26, 0.8) 50%, rgba(10, 10, 10, 0.9) 100%), url("/images/octopus.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, #00ff9d20 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00a8ff20 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          py: 4,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px #00ff9d',
                mb: 2,
                animation: 'glow 2s ease-in-out infinite alternate',
                '@keyframes glow': {
                  '0%': { textShadow: '0 0 30px #00ff9d' },
                  '100%': { textShadow: '0 0 40px #00a8ff, 0 0 50px #00ff9d' },
                },
              }}
            >
              CREATE YOUR LEGEND
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 400,
                mb: 3,
              }}
            >
              Transform into a Pool Master
            </Typography>
          </Box>

          {/* Success Message */}
          {isSuccess && (
            <Box sx={{ mb: 3 }}>
              <Alert
                severity="success"
                sx={{
                  background: 'rgba(0, 255, 157, 0.1)',
                  border: '2px solid #00ff9d',
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  '& .MuiAlert-icon': {
                    color: '#00ff9d',
                  },
                }}
              >
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 1 }}>
                  🎉 SUCCESS!
                </Typography>
                <Typography>{successMessage}</Typography>
                <Typography variant="body2" sx={{ color: '#00a8ff', mt: 1 }}>
                  Redirecting to dashboard...
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Error Message */}
          {error && (
            <Box sx={{ mb: 3 }}>
              <Alert
                severity="error"
                sx={{
                  background: 'rgba(255, 0, 0, 0.1)',
                  border: '2px solid #ff4444',
                  color: '#ff4444',
                  fontFamily: 'Orbitron, monospace',
                  '& .MuiAlert-icon': {
                    color: '#ff4444',
                  },
                }}
              >
                {error}
              </Alert>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            {/* Left Column - Form */}
            <Box sx={{ flex: 1 }}>
              <Card
                sx={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid #00ff9d',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
                }}
              >
                {/* Image Upload */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00ff9d',
                    fontFamily: 'Orbitron, monospace',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <UploadIcon /> UPLOAD YOUR IMAGE
                </Typography>
                
                <Box
                  sx={{
                    border: '2px dashed #00a8ff',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: '#00ff9d',
                      boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
                    },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <UploadIcon sx={{ fontSize: 48, color: '#00a8ff', mb: 2 }} />
                  <Typography sx={{ color: '#00a8ff', mb: 1, fontWeight: 600 }}>
                    Click to upload or drag and drop
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    PNG, JPG up to 10MB
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#00ff9d', fontStyle: 'italic' }}>
                    Full body shot (recommended but not compulsory)
                  </Typography>
                </Box>

                {/* Custom Prompt */}
                <TextField
                  fullWidth
                  label="Custom Description (Optional)"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={isGenerating}
                  multiline
                  rows={3}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: '#00a8ff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00ff9d',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00ff9d',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#00a8ff',
                    },
                  }}
                />

                {/* Customization Strength */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00ff9d',
                    fontFamily: 'Orbitron, monospace',
                    mt: 3,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CustomizeIcon /> CUSTOMIZATION
                </Typography>

                <Typography sx={{ color: '#00a8ff', mb: 1 }}>
                  Style Strength: {Math.round(strength * 100)}%
                </Typography>
                <Slider
                  value={strength}
                  onChange={(_, value) => setStrength(value as number)}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={isGenerating}
                  sx={{
                    mb: 2,
                    '& .MuiSlider-track': {
                      background: 'linear-gradient(90deg, #00a8ff, #00ff9d)',
                    },
                    '& .MuiSlider-thumb': {
                      background: '#00ff9d',
                      '&:hover': {
                        boxShadow: '0 0 20px #00ff9d',
                      },
                    },
                  }}
                />
              </Card>
            </Box>

            {/* Right Column - Preview and Details */}
            <Box sx={{ flex: 1 }}>
              <Card
                sx={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid #00a8ff',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
                }}
              >
                {/* Avatar Preview */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00a8ff',
                    fontFamily: 'Orbitron, monospace',
                    mb: 2,
                  }}
                >
                  3D AVATAR PREVIEW
                </Typography>
                
                <Box sx={{ width: '100%', height: 400, mb: 3 }}>
                  {model3DUrl ? (
                    <Avatar3DModelViewer modelUrl={model3DUrl} height={400} />
                  ) : (
                    <Avatar3DPreview image={typeof previewUrl === 'string' ? previewUrl : undefined} prompt={customPrompt} />
                  )}
                </Box>

                {/* Generate Avatar Button */}
                <Button
                  variant="contained"
                  onClick={handleGenerateAvatar}
                  disabled={isGenerating || (!selectedFile && !customPrompt)}
                  fullWidth
                  startIcon={<CustomizeIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                    color: '#000',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 700,
                    py: 1.5,
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                      boxShadow: '0 0 30px rgba(0, 168, 255, 0.7)',
                    },
                    '&:disabled': {
                      background: '#333',
                      color: '#666',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {isGenerating ? (
                    <CircularProgress size={24} sx={{ color: '#000' }} />
                  ) : (
                    'GENERATE AVATAR'
                  )}
                </Button>

                {/* Profile Details */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00a8ff',
                    fontFamily: 'Orbitron, monospace',
                    mb: 2,
                  }}
                >
                  PROFILE DETAILS
                </Typography>

                <TextField
                  fullWidth
                  label="Nickname *"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={isGenerating}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: '#00a8ff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00ff9d',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00ff9d',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#00a8ff',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Bio (Optional)"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isGenerating}
                  multiline
                  rows={3}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: '#00a8ff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#00ff9d',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00ff9d',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#00a8ff',
                    },
                  }}
                />

                {/* Save Button */}
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isGenerating || !previewUrl || !nickname}
                  fullWidth
                  startIcon={<SaveIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                    color: '#000',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 700,
                    py: 2,
                    borderRadius: 2,
                    boxShadow: '0 0 20px rgba(0, 168, 255, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                      boxShadow: '0 0 30px rgba(0, 255, 157, 0.7)',
                    },
                    '&:disabled': {
                      background: '#333',
                      color: '#666',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {isGenerating ? (
                    <CircularProgress size={24} sx={{ color: '#000' }} />
                  ) : (
                    'SAVE & ENTER DOJO'
                  )}
                </Button>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AvatarCreation; 