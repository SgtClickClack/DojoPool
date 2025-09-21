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
import {
  Content,
  ContentStatus,
  ContentType,
  ContentVisibility,
  ModerateContentRequest,
} from '@/types/content';

const contentTypeLabels = {
  [ContentType.MATCH_REPLAY]: '🎮 Match',
  [ContentType.CUSTOM_ITEM]: '🎨 Custom',
  [ContentType.HIGH_SCORE]: '🏆 Score',
  [ContentType.ACHIEVEMENT]: '🎯 Achievement',
  [ContentType.TOURNAMENT_HIGHLIGHT]: '🏟️ Tournament',
  [ContentType.VENUE_REVIEW]: '🏢 Venue',
  [ContentType.GENERAL]: '💬 General',
  [ContentType.EVENT]: '📅 Event',
  [ContentType.NEWS_ARTICLE]: '📰 News',
  [ContentType.SYSTEM_MESSAGE]: '📢 System',
};

const visibilityLabels = {
  [ContentVisibility.PUBLIC]: '🌐 Public',
  [ContentVisibility.FRIENDS_ONLY]: '👥 Friends',
  [ContentVisibility.PRIVATE]: '🔒 Private',
};

interface ContentModerationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedContent: Content | null;
  moderationData: ModerateContentRequest;
  onModerationDataChange: (data: ModerateContentRequest) => void;
  moderating: boolean;
}

const ContentModerationDialog: React.FC<ContentModerationDialogProps> = ({
  open,
  onClose,
  onSubmit,
  selectedContent,
  moderationData,
  onModerationDataChange,
  moderating,
}) => {
  const handleModerationDataChange = (field: keyof ModerateContentRequest, value: string) => {
    onModerationDataChange({
      ...moderationData,
      [field]: value,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Moderate Content: {selectedContent?.title}</DialogTitle>
      <DialogContent>
        {selectedContent && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Content Details
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Creator:</strong> {selectedContent.user.username}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Type:</strong>{' '}
                {contentTypeLabels[selectedContent.contentType]}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Visibility:</strong>{' '}
                {visibilityLabels[selectedContent.visibility]}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Created:</strong>{' '}
                {new Date(selectedContent.createdAt).toLocaleString()}
              </Typography>

              {selectedContent.description && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Description:</strong> {selectedContent.description}
                </Typography>
              )}

              {selectedContent.fileUrl && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>File:</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      window.open(selectedContent.fileUrl!, '_blank')
                    }
                  >
                    View File
                  </Button>
                </Box>
              )}
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={moderationData.status}
                onChange={(e) => handleModerationDataChange('status', e.target.value)}
                label="Action"
              >
                <MenuItem value={ContentStatus.APPROVED}>✅ Approve</MenuItem>
                <MenuItem value={ContentStatus.REJECTED}>❌ Reject</MenuItem>
                <MenuItem value={ContentStatus.ARCHIVED}>📁 Archive</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Moderation Notes (Optional)"
              multiline
              rows={3}
              fullWidth
              value={moderationData.moderationNotes}
              onChange={(e) => handleModerationDataChange('moderationNotes', e.target.value)}
              placeholder="Add notes about your moderation decision..."
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={moderating}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={moderating}
        >
          {moderating ? 'Processing...' : 'Submit Moderation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContentModerationDialog;
