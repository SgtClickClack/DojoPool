import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import React from 'react';
import {
  Feedback,
  FeedbackStatus,
  FeedbackCategory,
} from '@/types/feedback';

const categoryLabels = {
  [FeedbackCategory.BUG]: '🐛 Bug',
  [FeedbackCategory.FEATURE_REQUEST]: '💡 Feature',
  [FeedbackCategory.GENERAL_FEEDBACK]: '💬 Feedback',
  [FeedbackCategory.VENUE_ISSUE]: '🏢 Venue',
  [FeedbackCategory.TECHNICAL_SUPPORT]: '🛠️ Support',
  [FeedbackCategory.UI_UX_IMPROVEMENT]: '🎨 UI/UX',
  [FeedbackCategory.PERFORMANCE_ISSUE]: '⚡ Performance',
};

interface FeedbackUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedFeedback: Feedback | null;
  onSelectedFeedbackChange: (feedback: Feedback | null) => void;
  updating: boolean;
}

const FeedbackUpdateDialog: React.FC<FeedbackUpdateDialogProps> = ({
  open,
  onClose,
  onSubmit,
  selectedFeedback,
  onSelectedFeedbackChange,
  updating,
}) => {
  const handleFeedbackChange = (field: keyof Feedback, value: any) => {
    if (selectedFeedback) {
      onSelectedFeedbackChange({
        ...selectedFeedback,
        [field]: value,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Update Feedback</DialogTitle>
      <DialogContent>
        {selectedFeedback && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {categoryLabels[selectedFeedback.category]}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              From: {selectedFeedback.user.username} (
              {selectedFeedback.user.email})
            </Typography>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2">
                {selectedFeedback.message}
              </Typography>
            </Paper>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedFeedback.status}
                onChange={(e) => handleFeedbackChange('status', e.target.value)}
                label="Status"
              >
                {Object.values(FeedbackStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Admin Notes"
              multiline
              rows={3}
              fullWidth
              value={selectedFeedback.adminNotes || ''}
              onChange={(e) => handleFeedbackChange('adminNotes', e.target.value)}
              placeholder="Add internal notes about this feedback..."
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={updating}
        >
          {updating ? 'Updating...' : 'Update Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackUpdateDialog;
