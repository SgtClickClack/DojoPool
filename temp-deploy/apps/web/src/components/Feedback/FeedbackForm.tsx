import { submitFeedback } from '@/services/APIService';
import { FeedbackCategory } from '@/types/feedback';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface FeedbackFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const categoryLabels = {
  [FeedbackCategory.BUG]: '🐛 Bug Report',
  [FeedbackCategory.FEATURE_REQUEST]: '💡 Feature Request',
  [FeedbackCategory.GENERAL_FEEDBACK]: '💬 General Feedback',
  [FeedbackCategory.VENUE_ISSUE]: '🏢 Venue Issue',
  [FeedbackCategory.TECHNICAL_SUPPORT]: '🛠️ Technical Support',
  [FeedbackCategory.UI_UX_IMPROVEMENT]: '🎨 UI/UX Improvement',
  [FeedbackCategory.PERFORMANCE_ISSUE]: '⚡ Performance Issue',
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
};

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !category) {
      setError('Please fill in all required fields');
      return;
    }

    if (message.length > 2000) {
      setError('Message must be less than 2000 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        message: message.trim(),
        category: category as FeedbackCategory,
        additionalContext: additionalContext.trim() || undefined,
      });

      setSuccess(true);
      setMessage('');
      setCategory('');
      setAdditionalContext('');

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
        Submit Feedback
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Help us improve Dojo Pool by sharing your thoughts, reporting bugs, or
        suggesting features.
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
      >
        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            label="Category"
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
        />

        <TextField
          label="Additional Context (Optional)"
          multiline
          rows={2}
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Any additional details, screenshots, or context that might help..."
          fullWidth
          helperText="URLs, error messages, or specific steps to reproduce"
        />

        <Box
          sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}
        >
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !message.trim() || !category}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
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
    </Paper>
  );
};
