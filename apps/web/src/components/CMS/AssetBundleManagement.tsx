import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface AssetBundle {
  id: string;
  contentId: string;
  bundleType: 'AVATAR_ITEMS' | 'THEME' | 'SOUNDS' | 'EFFECTS';
  version: string;
  isActive: boolean;
  downloadUrl?: string;
  fileSize?: number;
  checksum?: string;
  minAppVersion?: string;
  targetPlatform: string[];
  dependencies: string[];
  createdBy: string;
  content: {
    title: string;
    description?: string;
    tags: string[];
  };
}

interface CreateAssetBundleData {
  title: string;
  description?: string;
  bundleType: 'AVATAR_ITEMS' | 'THEME' | 'SOUNDS' | 'EFFECTS';
  version: string;
  isActive: boolean;
  downloadUrl?: string;
  fileSize?: number;
  checksum?: string;
  minAppVersion?: string;
  targetPlatform: string[];
  dependencies: string[];
  tags: string[];
}

const AssetBundleManagement: React.FC = () => {
  const [assetBundles, setAssetBundles] = useState<AssetBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<AssetBundle | null>(null);
  const [formData, setFormData] = useState<CreateAssetBundleData>({
    title: '',
    description: '',
    bundleType: 'AVATAR_ITEMS',
    version: '1.0.0',
    isActive: true,
    downloadUrl: '',
    fileSize: undefined,
    checksum: '',
    minAppVersion: '',
    targetPlatform: ['WEB', 'MOBILE'],
    dependencies: [],
    tags: [],
  });

  useEffect(() => {
    fetchAssetBundles();
  }, []);

  const fetchAssetBundles = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call to /api/loms/assets
      const mockBundles: AssetBundle[] = [
        {
          id: '1',
          contentId: 'content-1',
          bundleType: 'AVATAR_ITEMS',
          version: '1.2.0',
          isActive: true,
          downloadUrl:
            'https://cdn.dojopool.com/bundles/avatar-items-1.2.0.zip',
          fileSize: 5242880, // 5MB in bytes
          checksum: 'a1b2c3d4e5f6...',
          minAppVersion: '2.1.0',
          targetPlatform: ['WEB', 'MOBILE'],
          dependencies: [],
          createdBy: 'admin',
          content: {
            title: 'Cyberpunk Avatar Items',
            description: 'New cyberpunk-themed avatar customization items',
            tags: ['avatar', 'cyberpunk', 'items'],
          },
        },
        {
          id: '2',
          contentId: 'content-2',
          bundleType: 'THEME',
          version: '1.0.1',
          isActive: true,
          downloadUrl: 'https://cdn.dojopool.com/bundles/neon-theme-1.0.1.zip',
          fileSize: 2097152, // 2MB in bytes
          checksum: 'f6e5d4c3b2a1...',
          minAppVersion: '2.0.0',
          targetPlatform: ['WEB'],
          dependencies: [],
          createdBy: 'admin',
          content: {
            title: 'Neon City Theme',
            description: 'Retro-futuristic neon theme for the game interface',
            tags: ['theme', 'neon', 'retro'],
          },
        },
      ];
      setAssetBundles(mockBundles);
    } catch (err) {
      setError('Failed to fetch asset bundles');
      console.error('Error fetching asset bundles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssetBundle = async () => {
    try {
      // TODO: Replace with actual API call to POST /api/loms/assets
      console.log('Creating asset bundle:', formData);
      await fetchAssetBundles(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      setError('Failed to create asset bundle');
      console.error('Error creating asset bundle:', err);
    }
  };

  const handleUpdateAssetBundle = async () => {
    if (!editingBundle) return;

    try {
      // TODO: Replace with actual API call to PUT /api/loms/assets/:id
      console.log('Updating asset bundle:', editingBundle.id, formData);
      await fetchAssetBundles(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      setError('Failed to update asset bundle');
      console.error('Error updating asset bundle:', err);
    }
  };

  const handleDeleteAssetBundle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset bundle?')) return;

    try {
      // TODO: Replace with actual API call to DELETE /api/loms/assets/:id
      console.log('Deleting asset bundle:', id);
      await fetchAssetBundles(); // Refresh the list
    } catch (err) {
      setError('Failed to delete asset bundle');
      console.error('Error deleting asset bundle:', err);
    }
  };

  const handleDownloadBundle = async (bundle: AssetBundle) => {
    if (!bundle.downloadUrl) return;

    try {
      // TODO: Implement actual download logic
      window.open(bundle.downloadUrl, '_blank');
    } catch (err) {
      setError('Failed to download asset bundle');
      console.error('Error downloading bundle:', err);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingBundle(null);
    setFormData({
      title: '',
      description: '',
      bundleType: 'AVATAR_ITEMS',
      version: '1.0.0',
      isActive: true,
      downloadUrl: '',
      fileSize: undefined,
      checksum: '',
      minAppVersion: '',
      targetPlatform: ['WEB', 'MOBILE'],
      dependencies: [],
      tags: [],
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (bundle: AssetBundle) => {
    setEditingBundle(bundle);
    setFormData({
      title: bundle.content.title,
      description: bundle.content.description || '',
      bundleType: bundle.bundleType,
      version: bundle.version,
      isActive: bundle.isActive,
      downloadUrl: bundle.downloadUrl || '',
      fileSize: bundle.fileSize,
      checksum: bundle.checksum || '',
      minAppVersion: bundle.minAppVersion || '',
      targetPlatform: bundle.targetPlatform,
      dependencies: bundle.dependencies,
      tags: bundle.content.tags || [],
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBundle(null);
    setError(null);
  };

  const handleInputChange = (
    field: keyof CreateAssetBundleData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading asset bundles...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" component="h2">
          Asset Bundle Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Create Bundle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Platforms</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assetBundles.map((bundle) => (
              <TableRow key={bundle.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {bundle.content.title}
                    </Typography>
                    {bundle.content.description && (
                      <Typography variant="body2" color="text.secondary">
                        {bundle.content.description}
                      </Typography>
                    )}
                    <Box mt={1}>
                      {(bundle.content.tags || []).map((tag: string) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={bundle.bundleType.replace('_', ' ')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{bundle.version}</Typography>
                  {bundle.minAppVersion && (
                    <Typography variant="body2" color="text.secondary">
                      Min: {bundle.minAppVersion}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatFileSize(bundle.fileSize)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {bundle.targetPlatform.map((platform) => (
                      <Chip
                        key={platform}
                        label={platform}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={bundle.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={bundle.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleDownloadBundle(bundle)}
                    disabled={!bundle.downloadUrl}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEditDialog(bundle)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteAssetBundle(bundle.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBundle ? 'Edit Asset Bundle' : 'Create New Asset Bundle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                required
                placeholder="1.0.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Bundle Type</InputLabel>
                <Select
                  value={formData.bundleType}
                  label="Bundle Type"
                  onChange={(e) =>
                    handleInputChange('bundleType', e.target.value)
                  }
                >
                  <MenuItem value="AVATAR_ITEMS">Avatar Items</MenuItem>
                  <MenuItem value="THEME">Theme</MenuItem>
                  <MenuItem value="SOUNDS">Sounds</MenuItem>
                  <MenuItem value="EFFECTS">Effects</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Download URL"
                value={formData.downloadUrl}
                onChange={(e) =>
                  handleInputChange('downloadUrl', e.target.value)
                }
                placeholder="https://cdn.example.com/bundle.zip"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="File Size (bytes)"
                type="number"
                value={formData.fileSize || ''}
                onChange={(e) =>
                  handleInputChange(
                    'fileSize',
                    parseInt(e.target.value) || undefined
                  )
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum App Version"
                value={formData.minAppVersion}
                onChange={(e) =>
                  handleInputChange('minAppVersion', e.target.value)
                }
                placeholder="2.1.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Checksum"
                value={formData.checksum}
                onChange={(e) => handleInputChange('checksum', e.target.value)}
                placeholder="SHA256 hash for integrity verification"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={
              editingBundle ? handleUpdateAssetBundle : handleCreateAssetBundle
            }
            variant="contained"
          >
            {editingBundle ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add asset bundle"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleOpenCreateDialog}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default AssetBundleManagement;
