import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import React from 'react';

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
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    username: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewFormData {
  status: string;
  rejectionReason: string;
  approvedPrice: string;
}

interface AdminReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedItem: CosmeticItem | null;
  reviewFormData: ReviewFormData;
  onFormDataChange: (data: ReviewFormData) => void;
}

const AdminReviewDialog: React.FC<AdminReviewDialogProps> = ({
  open,
  onClose,
  onSubmit,
  selectedItem,
  reviewFormData,
  onFormDataChange,
}) => {
  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      CUE_SKIN: 'Cue Skin',
      BALL_SET: 'Ball Set',
      TABLE_THEME: 'Table Theme',
      TABLE_CLOTH: 'Table Cloth',
      AVATAR_FRAME: 'Avatar Frame',
      PARTICLE_EFFECT: 'Particle Effect',
      SOUND_PACK: 'Sound Pack',
      OTHER: 'Other',
    };
    return categories[category] || category;
  };

  const handleFormChange = (field: string, value: string) => {
    onFormDataChange({ ...reviewFormData, [field]: value });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Review Submission: {selectedItem?.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Decision</InputLabel>
            <Select
              value={reviewFormData.status}
              label="Decision"
              onChange={(e) => handleFormChange('status', e.target.value)}
            >
              <MenuItem value="APPROVED">Approve</MenuItem>
              <MenuItem value="REJECTED">Reject</MenuItem>
              <MenuItem value="REQUIRES_CHANGES">Requires Changes</MenuItem>
            </Select>
          </FormControl>

          {reviewFormData.status === 'APPROVED' && (
            <TextField
              fullWidth
              label="Marketplace Price (DojoCoins)"
              type="number"
              value={reviewFormData.approvedPrice}
              onChange={(e) => handleFormChange('approvedPrice', e.target.value)}
              helperText="Price in DojoCoins for approved items"
            />
          )}

          {(reviewFormData.status === 'REJECTED' ||
            reviewFormData.status === 'REQUIRES_CHANGES') && (
            <TextField
              fullWidth
              label="Feedback/Reason"
              value={reviewFormData.rejectionReason}
              onChange={(e) => handleFormChange('rejectionReason', e.target.value)}
              multiline
              rows={3}
              required
              helperText="Provide constructive feedback to help the creator improve"
            />
          )}

          {selectedItem && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Submission Details:
              </Typography>
              <Typography variant="body2">
                Creator: {selectedItem.creator.username}
              </Typography>
              <Typography variant="body2">
                Category: {getCategoryLabel(selectedItem.category)}
              </Typography>
              <Typography variant="body2">
                Created:{' '}
                {new Date(selectedItem.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">
          Submit Review
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminReviewDialog;
