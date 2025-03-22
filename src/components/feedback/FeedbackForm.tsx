import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  TextField,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
}

export interface FeedbackData {
  rating: number;
  category: string;
  comment: string;
  gameId?: string;
  timestamp: string;
}

const categories = [
  'Game Experience',
  'Shot Analysis',
  'Performance',
  'UI/UX',
  'Bug Report',
  'Feature Request',
  'Other'
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !category || !comment) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        category,
        comment,
        timestamp: new Date().toISOString()
      });
      setShowSuccess(true);
      handleReset();
      onClose();
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setCategory('');
    setComment('');
    setError('');
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Share Your Feedback
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography component="legend">Rate your experience</Typography>
              <Rating
                name="feedback-rating"
                value={rating}
                onChange={(_, value) => setRating(value || 0)}
                size="large"
                sx={{ mt: 1 }}
              />
            </Box>

            <TextField
              select
              fullWidth
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              SelectProps={{
                native: true
              }}
              sx={{ mb: 3 }}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Your feedback"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              error={!!error}
              helperText={error}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Thank you for your feedback!
        </Alert>
      </Snackbar>
    </>
  );
}; 