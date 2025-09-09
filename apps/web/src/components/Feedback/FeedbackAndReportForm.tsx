import { submitFeedback, uploadFiles } from '@/services/APIService';
import { validateFeedbackForm } from '@dojopool/shared';
import { FeedbackCategory } from '@dojopool/types';
import { AttachFile, CloudUpload, Delete } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

interface FeedbackAndReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

const categoryLabels = {
  [FeedbackCategory.BUG]: '🐛 Bug Report',
  [FeedbackCategory.FEATURE_REQUEST]: '💡 Feature Request',
  [FeedbackCategory.GENERAL_FEEDBACK]: '💬 General Feedback',
  [FeedbackCategory.VENUE_ISSUE]: '🏢 Venue Issue',
  [FeedbackCategory.TECHNICAL_SUPPORT]: '🛠️ Technical Support',
  [FeedbackCategory.UI_UX_IMPROVEMENT]: '🎨 UI/UX Improvement',
  [FeedbackCategory.PERFORMANCE_ISSUE]: '⚡ Performance Issue',
  [FeedbackCategory.PLAYER_REPORT]: '👤 Player Report',
};

const categoryDescriptions = {
  [FeedbackCategory.BUG]: 'Report a bug or error you encountered',
  [FeedbackCategory.FEATURE_REQUEST]: 'Suggest a new feature or improvement',
  [FeedbackCategory.GENERAL_FEEDBACK]:
    'Share your general thoughts about the platform',
  [FeedbackCategory.VENUE_ISSUE]:
    'Report issues with venues or location services',
  [FeedbackCategory.TECHNICAL_SUPPORT]: 'Get help with technical problems',
  [FeedbackCategory.UI_UX_IMPROVEMENT]:
    'Suggest improvements to the user interface',
  [FeedbackCategory.PERFORMANCE_ISSUE]:
    'Report slow loading or performance issues',
  [FeedbackCategory.PLAYER_REPORT]:
    'Report inappropriate behavior by another player',
};

export const FeedbackAndReportForm: React.FC<FeedbackAndReportFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return;

      // Validate file count
      if (uploadedFiles.length + files.length > 5) {
        setError('Maximum 5 attachments allowed');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append('files', file);
        });

        const response = await uploadFiles(formData);
        setUploadedFiles((prev) => [...prev, ...response.files]);
        setUploadProgress(100);
      } catch (err: any) {
        setError(err.response?.data?.message || 'File upload failed');
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [uploadedFiles.length]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation using Zod schema
    const validationResult = validateFeedbackForm({
      message: message.trim(),
      category,
      additionalContext: additionalContext.trim() || undefined,
      attachments: uploadedFiles.map((f) => f.url),
    });

    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        message: message.trim(),
        category: category as FeedbackCategory,
        additionalContext: additionalContext.trim() || undefined,
        attachments: uploadedFiles.map((f) => f.url),
      });

      setSuccess(true);
      setMessage('');
      setCategory('');
      setAdditionalContext('');
      setUploadedFiles([]);

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="success.main" gutterBottom>
          ✅ Feedback Submitted Successfully!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Thank you for your feedback. Our team will review it and get back to
          you if needed.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Submit Feedback & Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Help us improve Dojo Pool by sharing your thoughts, reporting bugs,
        suggesting features, or reporting inappropriate behavior.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        data-testid="feedback-form"
      >
        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            label="Category"
            data-testid="category-select"
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                <Box>
                  <Typography variant="body2">{label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {categoryDescriptions[value as FeedbackCategory]}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Your Feedback"
          multiline
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your feedback, bug report, or feature request in detail..."
          required
          fullWidth
          helperText={`${message.length}/2000 characters`}
          error={message.length > 2000}
          data-testid="message-textarea"
        />

        <TextField
          label="Additional Context (Optional)"
          multiline
          rows={2}
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Any additional details, URLs, error messages, or specific steps to reproduce..."
          fullWidth
          helperText="URLs, error messages, or specific steps to reproduce"
          data-testid="additional-context"
        />

        {/* File Upload Section */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Attachments (Optional)
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 2, display: 'block' }}
          >
            Upload screenshots, videos, or documents to support your feedback.
            Max 5 files, 10MB each.
          </Typography>

          {/* Upload Area */}
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            data-testid="file-drop-zone"
          >
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.txt"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              id="file-upload"
              data-testid="file-upload"
            />
            <label htmlFor="file-upload">
              <CloudUpload
                sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
              />
              <Typography variant="body2" gutterBottom>
                Drag & drop files here or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Images, videos, PDFs, or text files
              </Typography>
            </label>
          </Box>

          {/* Upload Progress */}
          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary">
                Uploading files...
              </Typography>
            </Box>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Uploaded Files ({uploadedFiles.length}/5)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {uploadedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.filename} (${formatFileSize(file.size)})`}
                    onDelete={() => removeFile(index)}
                    deleteIcon={<Delete />}
                    onClick={() => setPreviewFile(file)}
                    icon={<AttachFile />}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Box
          sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}
        >
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={
              isSubmitting || isUploading || !message.trim() || !category
            }
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            data-testid="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 2, display: 'block' }}
      >
        Your feedback helps us improve Dojo Pool. We typically respond within
        24-48 hours for urgent issues.
      </Typography>

      {/* File Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
        data-testid="file-preview-dialog"
      >
        <DialogTitle>File Preview: {previewFile?.filename}</DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center' }}>
              {previewFile.mimetype.startsWith('image/') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.filename}
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              ) : previewFile.mimetype.startsWith('video/') ? (
                <video
                  src={previewFile.url}
                  controls
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              ) : (
                <Typography>
                  Preview not available for {previewFile.mimetype}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewFile(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
