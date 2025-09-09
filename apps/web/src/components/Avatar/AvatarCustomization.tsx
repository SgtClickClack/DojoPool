'use client';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/APIService';
import { AvatarAsset, AvatarCustomizationData } from '@/types/avatar';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { AvatarAssetGallery } from './AvatarAssetGallery';
import { AvatarPreview } from './AvatarPreview';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AvatarCustomization: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [avatarData, setAvatarData] = useState<any>(null);
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AvatarAsset[]>([]);
  const [customization, setCustomization] = useState<AvatarCustomizationData>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Load user's avatar data and assets
  useEffect(() => {
    if (user?.id) {
      loadAvatarData();
    }
  }, [user?.id]);

  const loadAvatarData = async () => {
    try {
      setIsLoading(true);

      // Load user's current avatar
      const [avatarResponse, assetsResponse, availableResponse] =
        await Promise.all([
          apiClient.get('/v1/avatar/me'),
          apiClient.get('/v1/avatar/my-assets'),
          apiClient.get('/v1/avatar/assets'),
        ]);

      setAvatarData(avatarResponse.data);
      setUserAssets(assetsResponse.data);
      setAvailableAssets(availableResponse.data);

      // Initialize customization from current avatar
      if (avatarResponse.data?.configuration) {
        setCustomization(avatarResponse.data.configuration);
      }
    } catch (error: any) {
      console.error('Failed to load avatar data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load avatar data. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomizationChange = (
    newCustomization: AvatarCustomizationData
  ) => {
    setCustomization(newCustomization);
  };

  const handleSaveCustomization = async () => {
    try {
      setIsSaving(true);

      await apiClient.post('/v1/avatar/customize', customization);

      setSnackbar({
        open: true,
        message: 'Avatar customization saved successfully!',
        severity: 'success',
      });

      // Reload avatar data to reflect changes
      await loadAvatarData();
    } catch (error: any) {
      console.error('Failed to save avatar customization:', error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          'Failed to save avatar customization.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAvatar = async () => {
    try {
      setIsSaving(true);

      await apiClient.post('/v1/avatar/reset');

      setSnackbar({
        open: true,
        message: 'Avatar reset to default successfully!',
        severity: 'success',
      });

      // Reset local customization and reload data
      setCustomization({});
      await loadAvatarData();
    } catch (error: any) {
      console.error('Failed to reset avatar:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reset avatar. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurchaseAsset = async (assetId: string) => {
    try {
      await apiClient.post('/v1/avatar/purchase', { assetId });

      setSnackbar({
        open: true,
        message: 'Asset purchased successfully!',
        severity: 'success',
      });

      // Reload user assets
      const assetsResponse = await apiClient.get('/v1/avatar/my-assets');
      setUserAssets(assetsResponse.data);
    } catch (error: any) {
      console.error('Failed to purchase asset:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to purchase asset.',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress sx={{ color: '#00ff9d' }} />
        <Typography sx={{ ml: 2, color: 'text.secondary' }}>
          Loading your avatar...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={4}>
        {/* Avatar Preview */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(26, 26, 46, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{ mb: 3, color: '#00ff9d', fontWeight: 'bold' }}
            >
              Avatar Preview
            </Typography>

            <AvatarPreview
              customization={customization}
              avatarData={avatarData}
              size="large"
            />

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleSaveCustomization}
                disabled={isSaving}
                sx={{
                  backgroundColor: '#00ff9d',
                  color: '#000',
                  '&:hover': {
                    backgroundColor: '#00cc7a',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(0, 255, 157, 0.3)',
                  },
                }}
              >
                {isSaving ? (
                  <CircularProgress size={20} sx={{ color: '#000' }} />
                ) : (
                  'Save Changes'
                )}
              </Button>

              <Button
                variant="outlined"
                onClick={handleResetAvatar}
                disabled={isSaving}
                sx={{
                  borderColor: '#ff6b6b',
                  color: '#ff6b6b',
                  '&:hover': {
                    borderColor: '#cc5555',
                    color: '#cc5555',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  },
                }}
              >
                Reset to Default
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Customization Panel */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              background: 'rgba(26, 26, 46, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={currentTab}
                onChange={(_, newValue) => setCurrentTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: '#00ff9d',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#00ff9d',
                  },
                }}
              >
                <Tab label="Appearance" />
                <Tab label="Clothing" />
                <Tab label="Accessories" />
                <Tab label="Special" />
              </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
              <AvatarAssetGallery
                assets={availableAssets.filter((asset) =>
                  ['HAIR', 'FACE'].includes(asset.type)
                )}
                ownedAssets={userAssets}
                customization={customization}
                onCustomizationChange={handleCustomizationChange}
                onPurchaseAsset={handlePurchaseAsset}
                category="appearance"
              />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <AvatarAssetGallery
                assets={availableAssets.filter((asset) =>
                  ['CLOTHES_TOP', 'CLOTHES_BOTTOM', 'SHOES'].includes(
                    asset.type
                  )
                )}
                ownedAssets={userAssets}
                customization={customization}
                onCustomizationChange={handleCustomizationChange}
                onPurchaseAsset={handlePurchaseAsset}
                category="clothing"
              />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <AvatarAssetGallery
                assets={availableAssets.filter((asset) =>
                  [
                    'ACCESSORY_HEAD',
                    'ACCESSORY_NECK',
                    'ACCESSORY_BACK',
                  ].includes(asset.type)
                )}
                ownedAssets={userAssets}
                customization={customization}
                onCustomizationChange={handleCustomizationChange}
                onPurchaseAsset={handlePurchaseAsset}
                category="accessories"
              />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <AvatarAssetGallery
                assets={availableAssets.filter((asset) =>
                  ['WEAPON', 'PET', 'EFFECT'].includes(asset.type)
                )}
                ownedAssets={userAssets}
                customization={customization}
                onCustomizationChange={handleCustomizationChange}
                onPurchaseAsset={handlePurchaseAsset}
                category="special"
              />
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            backgroundColor:
              snackbar.severity === 'success'
                ? 'rgba(0, 255, 157, 0.9)'
                : snackbar.severity === 'error'
                  ? 'rgba(255, 107, 107, 0.9)'
                  : 'rgba(0, 168, 255, 0.9)',
            color: '#000',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AvatarCustomization;
