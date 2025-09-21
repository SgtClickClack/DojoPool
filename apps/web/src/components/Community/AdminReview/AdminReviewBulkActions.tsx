import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import React from 'react';

interface AdminReviewBulkActionsProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReject: () => void;
}

const AdminReviewBulkActions: React.FC<AdminReviewBulkActionsProps> = ({
  selectedCount,
  onBulkApprove,
  onBulkReject,
}) => {
  if (selectedCount === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="contained"
        color="success"
        startIcon={<ApproveIcon />}
        onClick={onBulkApprove}
      >
        Approve Selected ({selectedCount})
      </Button>
      <Button
        variant="contained"
        color="error"
        startIcon={<RejectIcon />}
        onClick={onBulkReject}
      >
        Reject Selected ({selectedCount})
      </Button>
    </Box>
  );
};

export default AdminReviewBulkActions;
