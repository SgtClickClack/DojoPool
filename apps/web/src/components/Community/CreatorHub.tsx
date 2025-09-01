import { useAuth } from '@/hooks/useAuth';
import {
  Add as AddIcon,
  Brush as BrushIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Flash as FlashIcon,
  Image as ImageIcon,
  MusicNote as MusicNoteIcon,
  Palette as PaletteIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface CosmeticItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  designFileUrl?: string;
  previewImageUrl?: string;
  status: string;
  rejectionReason?: string;
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  metadata: {
    colors?: string[];
    style?: string;
    difficulty?: string;
    compatibility?: string[];
  };
}

const categories = [
  {
    value: 'CUE_SKIN',
    label: 'Cue Skin',
    icon: BrushIcon,
    description: 'Custom cue stick designs',
  },
  {
    value: 'BALL_SET',
    label: 'Ball Set',
    icon: PaletteIcon,
    description: 'Custom ball designs and patterns',
  },
  {
    value: 'TABLE_THEME',
    label: 'Table Theme',
    icon: ImageIcon,
    description: 'Complete table visual themes',
  },
  {
    value: 'TABLE_CLOTH',
    label: 'Table Cloth',
    icon: PaletteIcon,
    description: 'Custom table cloth patterns',
  },
  {
    value: 'AVATAR_FRAME',
    label: 'Avatar Frame',
    icon: ImageIcon,
    description: 'Profile picture frames',
  },
  {
    value: 'PARTICLE_EFFECT',
    label: 'Particle Effect',
    icon: FlashIcon,
    description: 'Visual effects and animations',
  },
  {
    value: 'SOUND_PACK',
    label: 'Sound Pack',
    icon: MusicNoteIcon,
    description: 'Custom audio effects',
  },
  {
    value: 'OTHER',
    label: 'Other',
    icon: PaletteIcon,
    description: 'Miscellaneous cosmetic items',
  },
];

const CreatorHub: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CosmeticItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<SubmissionFormData>({
    title: '',
    description: '',
    category: 'CUE_SKIN',
    tags: [],
    metadata: {},
  });

  const [selectedFiles, setSelectedFiles] = useState<{
    design?: File;
    preview?: File;
  }>({});

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const fetchMySubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/my-submissions');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        setError('Failed to fetch your submissions');
      }
    } catch (err) {
      setError('Failed to fetch your submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmission = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      category: 'CUE_SKIN',
      tags: [],
      metadata: {},
    });
    setSelectedFiles({});
    setDialogOpen(true);
  };

  const handleEditSubmission = (item: CosmeticItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category,
      tags: [], // Would parse from item if available
      metadata: {}, // Would parse from item if available
    });
    setSelectedFiles({});
    setDialogOpen(true);
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'design' | 'preview'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFiles((prev) => ({
        ...prev,
        [type]: file,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      const formDataToSend = new FormData();

      // Add form data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      formDataToSend.append('metadata', JSON.stringify(formData.metadata));

      // Add files
      if (selectedFiles.design) {
        formDataToSend.append('files', selectedFiles.design);
      }
      if (selectedFiles.preview) {
        formDataToSend.append('files', selectedFiles.preview);
      }

      const url = editingItem
        ? `/api/community/cosmetic-items/${editingItem.id}`
        : '/api/community/cosmetic-items';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (response.ok) {
        setSuccess(
          editingItem
            ? 'Submission updated successfully!'
            : 'Submission created successfully! It will be reviewed by our team.'
        );
        setDialogOpen(false);
        fetchMySubmissions();
      } else {
        setError('Failed to submit your cosmetic item');
      }
    } catch (err) {
      setError('Failed to submit your cosmetic item');
      console.error('Error submitting:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSubmission = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await fetch(`/api/community/cosmetic-items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Submission deleted successfully');
        fetchMySubmissions();
      } else {
        setError('Failed to delete submission');
      }
    } catch (err) {
      setError('Failed to delete submission');
      console.error('Error deleting submission:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'REQUIRES_CHANGES':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'REQUIRES_CHANGES':
        return 'Needs Changes';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading your submissions...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Creator Hub
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Share your creative cosmetic designs with the DojoPool community
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleCreateSubmission}
          sx={{ minWidth: 200 }}
        >
          Create Submission
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Submission Guidelines */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Submission Guidelines
        </Typography>
        <Typography variant="body2" paragraph>
          • All submissions are reviewed by our team before being published
        </Typography>
        <Typography variant="body2" paragraph>
          • Approved items become available in the marketplace and earn you
          DojoCoins
        </Typography>
        <Typography variant="body2" paragraph>
          • High-quality, original designs are more likely to be approved
        </Typography>
        <Typography variant="body2">
          • You can edit submissions that are still pending review
        </Typography>
      </Paper>

      {/* My Submissions */}
      <Typography variant="h6" component="h2" gutterBottom>
        My Submissions
      </Typography>

      {items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
          <BrushIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No submissions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first cosmetic item submission to get started!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSubmission}
          >
            Create Your First Submission
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {categories.find((c) => c.value === item.category)
                        ?.icon &&
                        React.createElement(
                          categories.find((c) => c.value === item.category)!
                            .icon,
                          { fontSize: 'small' }
                        )}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Chip
                        label={
                          categories.find((c) => c.value === item.category)
                            ?.label || item.category
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {item.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {item.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={getStatusLabel(item.status)}
                      size="small"
                      color={getStatusColor(item.status) as any}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {item.rejectionReason && (
                    <Alert
                      severity="warning"
                      sx={{ mt: 2, fontSize: '0.875rem' }}
                    >
                      <strong>Feedback:</strong> {item.rejectionReason}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      ❤️ {item.likes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      👁️ {item.views}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  {item.status === 'PENDING' && (
                    <IconButton
                      size="small"
                      onClick={() => handleEditSubmission(item)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {item.status === 'PENDING' && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSubmission(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Submission Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !uploading && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={uploading}
      >
        <DialogTitle>
          {editingItem ? 'Edit Submission' : 'Create New Submission'}
        </DialogTitle>
        <DialogContent>
          {uploading && <LinearProgress sx={{ mb: 2 }} />}

          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              disabled={uploading}
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
              placeholder="Describe your cosmetic item design..."
              disabled={uploading}
            />

            <FormControl fullWidth disabled={uploading}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <category.icon />
                      <Box>
                        <Typography variant="body2">
                          {category.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag),
                })
              }
              placeholder="modern, blue, abstract..."
              disabled={uploading}
            />

            {/* File Upload Section */}
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Upload Files
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <input
                      accept=".zip,.png,.jpg,.jpeg,.gif"
                      style={{ display: 'none' }}
                      id="design-file"
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'design')}
                      disabled={uploading}
                    />
                    <label htmlFor="design-file">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        fullWidth
                        disabled={uploading}
                      >
                        Design Files
                      </Button>
                    </label>
                    {selectedFiles.design && (
                      <Typography
                        variant="caption"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        {selectedFiles.design.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="preview-file"
                      type="file"
                      onChange={(e) => handleFileSelect(e, 'preview')}
                      disabled={uploading}
                    />
                    <label htmlFor="preview-file">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<ImageIcon />}
                        fullWidth
                        disabled={uploading}
                      >
                        Preview Image
                      </Button>
                    </label>
                    {selectedFiles.preview && (
                      <Typography
                        variant="caption"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        {selectedFiles.preview.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: 'block' }}
              >
                Supported formats: ZIP files for designs, PNG/JPG/GIF for
                previews (max 10MB each)
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={uploading || !formData.title.trim()}
          >
            {uploading
              ? 'Submitting...'
              : editingItem
                ? 'Update Submission'
                : 'Submit for Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreatorHub;
