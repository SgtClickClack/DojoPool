interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

import { uploadContent } from '@/services/APIService';
import {
  ContentType,
  type ContentUploadData,
  ContentVisibility,
} from '@/types/content';
import {
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ContentUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const contentTypeLabels = {
  [ContentType.MATCH_REPLAY]: '🎮 Match Replay',
  [ContentType.CUSTOM_ITEM]: '🎨 Custom Item',
  [ContentType.HIGH_SCORE]: '🏆 High Score',
  [ContentType.ACHIEVEMENT]: '🎯 Achievement',
  [ContentType.TOURNAMENT_HIGHLIGHT]: '🏟️ Tournament Highlight',
  [ContentType.VENUE_REVIEW]: '🏢 Venue Review',
  [ContentType.GENERAL]: '💬 General Content',
  [ContentType.EVENT]: '📅 Event',
  [ContentType.NEWS_ARTICLE]: '📰 News Article',
  [ContentType.SYSTEM_MESSAGE]: '📢 System Message',
};

const contentTypeDescriptions = {
  [ContentType.MATCH_REPLAY]: 'Share a recording of your pool match',
  [ContentType.CUSTOM_ITEM]: 'Show off your custom pool cues or accessories',
  [ContentType.HIGH_SCORE]: 'Share your high scores and achievements',
  [ContentType.ACHIEVEMENT]: 'Celebrate your gaming milestones',
  [ContentType.TOURNAMENT_HIGHLIGHT]: 'Share tournament moments and highlights',
  [ContentType.VENUE_REVIEW]: 'Review and share venue experiences',
  [ContentType.GENERAL]: 'Share any other content with the community',
  [ContentType.EVENT]: 'Share information about upcoming events',
  [ContentType.NEWS_ARTICLE]: 'Share news and updates',
  [ContentType.SYSTEM_MESSAGE]: 'System-generated messages',
};

const visibilityLabels = {
  [ContentVisibility.PUBLIC]: '🌐 Public - Everyone can see',
  [ContentVisibility.FRIENDS_ONLY]: '👥 Friends Only - Friends can see',
  [ContentVisibility.PRIVATE]: '🔒 Private - Only you can see',
};

export const ContentUpload: React.FC<ContentUploadProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ContentUploadData>({
    title: '',
    description: '',
    contentType: ContentType.GENERAL,
    visibility: ContentVisibility.PUBLIC,
    tags: [],
    metadata: {},
  });

  const [file, setFile] = useState<File | null>(null);
  const [currentTag, setCurrentTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/webm',
        'application/json',
        'text/plain',
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError(
          'Unsupported file type. Please upload an image, video, or supported file.'
        );
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.contentType) {
      setError('Content type is required');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadData: ContentUploadData = {
        ...formData,
        file: file || undefined,
        title: formData.title.trim(),
        description: formData.description?.trim(),
      };

      await uploadContent(uploadData);

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as AxiosError).response?.data?.message ||
            'Failed to upload content. Please try again.'
          : 'Failed to upload content. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="success.main" gutterBottom>
          ✅ Content Uploaded Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your content has been shared with the community and is pending
          approval.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Share Content
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Share your gaming experiences, achievements, and creations with the Dojo
        Pool community.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {/* File Upload */}
        <Box>
          <input
            accept="image/*,video/*,.json,.txt"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ height: 100, borderStyle: 'dashed' }}
            >
              {file ? (
                <Box>
                  <Typography variant="body1">{file.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              ) : (
                <Typography>Click to upload file (optional)</Typography>
              )}
            </Button>
          </label>
          {file && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={() => setFile(null)}
                startIcon={<DeleteIcon />}
              >
                Remove File
              </Button>
            </Box>
          )}
        </Box>

        {/* Title */}
        <TextField
          label="Title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
          fullWidth
          helperText="Give your content a catchy title"
        />

        {/* Description */}
        <TextField
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          multiline
          rows={3}
          fullWidth
          helperText="Describe your content and what makes it special"
        />

        {/* Content Type */}
        <FormControl fullWidth required>
          <InputLabel>Content Type</InputLabel>
          <Select
            value={formData.contentType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                contentType: e.target.value as ContentType,
              }))
            }
            label="Content Type"
          >
            {Object.entries(contentTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                <Box>
                  <Typography variant="body2">{label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {contentTypeDescriptions[value as ContentType]}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Visibility */}
        <FormControl fullWidth>
          <InputLabel>Visibility</InputLabel>
          <Select
            value={formData.visibility}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                visibility: e.target.value as ContentVisibility,
              }))
            }
            label="Visibility"
          >
            {Object.entries(visibilityLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tags */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Tags (Optional)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Add a tag..."
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && (e.preventDefault(), handleAddTag())
              }
              sx={{ flexGrow: 1 }}
            />
            <IconButton onClick={handleAddTag} disabled={!currentTag.trim()}>
              <AddIcon />
            </IconButton>
          </Box>
          {formData.tags && formData.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Submit Buttons */}
        <Box
          sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}
        >
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={
              uploading || !formData.title.trim() || !formData.contentType
            }
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? 'Uploading...' : 'Share Content'}
          </Button>
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 2, display: 'block' }}
      >
        Your content will be reviewed by moderators before being published.
        Supported formats: Images, Videos, JSON files, Text files (max 10MB).
      </Typography>
    </Paper>
  );
};
