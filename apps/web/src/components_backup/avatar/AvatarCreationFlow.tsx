import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Phone as PhoneIcon,
  Checkroom as WardrobeIcon,
  Portrait as AvatarIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import AvatarCreationService, {
  type ClothingItem,
  type AvatarAsset,
} from '../../services/avatar/AvatarCreationService';

interface AvatarCreationFlowProps {
  userId: string;
  onComplete?: (avatarId: string) => void;
}

const steps = [
  '3D Scanning',
  'Base Mesh Processing',
  'Wardrobe Selection',
  'Avatar Assembly',
  'Final Download',
];

const AvatarCreationFlow: React.FC<AvatarCreationFlowProps> = ({
  userId,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [baseMeshId, setBaseMeshId] = useState<string | null>(null);
  const [availableClothing, setAvailableClothing] = useState<ClothingItem[]>(
    []
  );
  const [selectedClothing, setSelectedClothing] = useState<string[]>([]);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatarAsset, setAvatarAsset] = useState<AvatarAsset | null>(null);
  const [scanningGuidelines, setScanningGuidelines] = useState<any>(null);

  useEffect(() => {
    loadScanningGuidelines();
    loadAvailableClothing();
  }, []);

  const loadScanningGuidelines = async () => {
    try {
      const platform = navigator.userAgent.includes('iPhone')
        ? 'ios'
        : 'android';
      const guidelines =
        await AvatarCreationService.getScanningGuidelines(platform);
      setScanningGuidelines(guidelines);
    } catch (error) {
      console.error('Failed to load scanning guidelines:', error);
    }
  };

  const loadAvailableClothing = async () => {
    try {
      const clothing = await AvatarCreationService.getAvailableClothing();
      setAvailableClothing(clothing);
    } catch (error) {
      console.error('Failed to load clothing:', error);
      setError('Failed to load clothing items');
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const startMobileScanning = () => {
    const platform = navigator.userAgent.includes('iPhone') ? 'ios' : 'android';
    const message = `To create your 3D avatar, please:

1. Open the DojoPool Mobile App
2. Navigate to Avatar Creation
3. Follow the ${platform === 'ios' ? 'ARKit' : 'ARCore'} scanning process
4. Your avatar will sync to this web interface

Would you like to continue on mobile or use the photogrammetry fallback?`;

    if (window.confirm(message)) {
      // In a real app, this would redirect to deep link or show QR code
      simulatePhotogrammetryScanning();
    }
  };

  const simulatePhotogrammetryScanning = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate photogrammetry scanning for demo purposes
      const mockImages = Array(12)
        .fill(0)
        .map(() => generateMockImageData());
      const result = await AvatarCreationService.submitPhotogrammetryScan(
        userId,
        mockImages
      );
      setScanId(result.scanId);

      // Poll for mesh completion
      pollBaseMeshStatus(result.scanId);
    } catch (error) {
      console.error('Scanning failed:', error);
      setError('Failed to process scan. Please try again.');
      setLoading(false);
    }
  };

  const generateMockImageData = (): string => {
    // Generate mock base64 image data for demo
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;

    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 640, 480);
    gradient.addColorStop(0, `hsl(${Math.random() * 360}, 50%, 50%)`);
    gradient.addColorStop(1, `hsl(${Math.random() * 360}, 50%, 30%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 480);

    return canvas.toDataURL().split(',')[1];
  };

  const pollBaseMeshStatus = async (scanId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const meshStatus =
          await AvatarCreationService.getBaseMeshStatus(scanId);

        if (meshStatus.status === 'ready') {
          setBaseMeshId(meshStatus.id);
          setLoading(false);
          handleNext();
        } else if (meshStatus.status === 'failed') {
          throw new Error('Mesh processing failed');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 2000);
        } else {
          throw new Error('Mesh processing timeout');
        }
      } catch (error) {
        console.error('Failed to check mesh status:', error);
        setError('Failed to process 3D mesh. Please try again.');
        setLoading(false);
      }
    };

    checkStatus();
  };

  const handleClothingSelection = (itemId: string) => {
    const item = availableClothing.find((i) => i.id === itemId);
    if (!item) return;

    // Check if same category already selected
    const existingIndex = selectedClothing.findIndex((id) => {
      const existingItem = availableClothing.find((i) => i.id === id);
      return existingItem?.category === item.category;
    });

    if (existingIndex !== -1) {
      // Replace existing item of same category
      const newSelection = [...selectedClothing];
      newSelection[existingIndex] = itemId;
      setSelectedClothing(newSelection);
    } else {
      // Add new item
      setSelectedClothing([...selectedClothing, itemId]);
    }
  };

  const createAvatar = async () => {
    if (!baseMeshId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await AvatarCreationService.createAvatar({
        baseMeshId,
        clothingItems: selectedClothing,
        userId,
      });

      setAvatarId(result.avatarId);
      pollAvatarStatus(result.avatarId);
    } catch (error) {
      console.error('Avatar creation failed:', error);
      setError('Failed to create avatar. Please try again.');
      setLoading(false);
    }
  };

  const pollAvatarStatus = async (avatarId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const asset = await AvatarCreationService.getAvatarStatus(avatarId);
        setAvatarAsset(asset);

        if (asset.status === 'ready') {
          setLoading(false);
          handleNext();
          onComplete?.(avatarId);
        } else if (asset.status === 'failed') {
          throw new Error('Avatar generation failed');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 2000);
        } else {
          throw new Error('Avatar generation timeout');
        }
      } catch (error) {
        console.error('Failed to check avatar status:', error);
        setError('Failed to generate avatar. Please try again.');
        setLoading(false);
      }
    };

    checkStatus();
  };

  const downloadAvatar = async () => {
    if (!avatarId) return;

    try {
      const url = await AvatarCreationService.getOptimizedAvatar(avatarId);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([url]));
      a.download = `avatar_${avatarId}.glb`;
      a.click();
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download avatar');
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3D Face Scanning
              </Typography>

              {scanningGuidelines && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Requirements:
                  </Typography>
                  {Object.entries(scanningGuidelines.requirements).map(
                    ([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    )
                  )}
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PhoneIcon />}
                    onClick={startMobileScanning}
                    sx={{ mb: 2 }}
                  >
                    Use Mobile App (Recommended)
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CameraIcon />}
                    onClick={simulatePhotogrammetryScanning}
                    disabled={loading}
                  >
                    Photogrammetry Demo
                  </Button>
                </Grid>
              </Grid>

              {loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Processing 3D scan...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Base Mesh Processing
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your 3D scan is being processed using Laplacian Mesh Deformation
                to create your base avatar.
              </Typography>
              {baseMeshId ? (
                <Alert severity="success">
                  Base mesh ready! Scan ID: {scanId}
                </Alert>
              ) : (
                <Box>
                  <CircularProgress sx={{ mr: 2 }} />
                  <Typography variant="body2">
                    Generating base mesh from your scan...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Choose Your Wardrobe
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Select clothing items for your avatar. You can choose one item
                per category.
              </Typography>

              <Grid container spacing={2}>
                {availableClothing.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedClothing.includes(item.id) ? 2 : 1,
                        borderColor: selectedClothing.includes(item.id)
                          ? 'primary.main'
                          : 'divider',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => handleClothingSelection(item.id)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {item.name}
                        </Typography>
                        <Chip
                          label={item.rarity}
                          size="small"
                          sx={{
                            backgroundColor:
                              item.rarity === 'legendary'
                                ? '#FFD700'
                                : item.rarity === 'epic'
                                  ? '#9C27B0'
                                  : item.rarity === 'rare'
                                    ? '#2196F3'
                                    : '#4CAF50',
                            color: 'white',
                            mb: 1,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          Category: {item.category}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box
                sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}
              >
                <Button onClick={handleBack}>Back</Button>
                <Button
                  variant="contained"
                  onClick={createAvatar}
                  disabled={selectedClothing.length === 0 || loading}
                >
                  Create Avatar
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avatar Assembly
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your avatar is being assembled with the selected clothing items.
              </Typography>

              {avatarAsset && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Status: {avatarAsset.status}
                  </Typography>
                  {avatarAsset.optimizations && (
                    <Typography variant="body2">
                      File size: {avatarAsset.optimizations.fileSizeKB} KB
                    </Typography>
                  )}
                </Box>
              )}

              {loading ? (
                <Box>
                  <CircularProgress sx={{ mr: 2 }} />
                  <Typography variant="body2">
                    Assembling your avatar...
                  </Typography>
                </Box>
              ) : (
                <Alert severity="success">Avatar ready for download!</Alert>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Avatar is Ready!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your 3D avatar has been successfully created and optimized with
                Draco compression and KTX2 textures.
              </Typography>

              {avatarAsset && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Optimizations applied:
                  </Typography>
                  <Chip
                    label={`Draco: ${avatarAsset.optimizations.dracoCompressed ? 'Yes' : 'No'}`}
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label={`KTX2: ${avatarAsset.optimizations.ktx2Textures ? 'Yes' : 'No'}`}
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label={`Size: ${avatarAsset.optimizations.fileSizeKB} KB`}
                    sx={{ mr: 1, mb: 1 }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={downloadAvatar}
                disabled={!avatarId}
              >
                Download Avatar (.glb)
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Create Your 3D Avatar
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderStepContent(activeStep)}
    </Box>
  );
};

export default AvatarCreationFlow;
