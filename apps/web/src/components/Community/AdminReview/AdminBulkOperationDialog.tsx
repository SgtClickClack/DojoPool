import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import React from 'react';

interface AdminBulkOperationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  operation: 'approve' | 'reject';
  selectedCount: number;
}

const AdminBulkOperationDialog: React.FC<AdminBulkOperationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  operation,
  selectedCount,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Bulk {operation === 'approve' ? 'Approve' : 'Reject'}
      </DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to {operation} {selectedCount}{' '}
          selected submissions?
        </Typography>
        {operation === 'approve' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All approved items will be set to 100 DojoCoins and added to the
            marketplace.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
        >
          Confirm {operation}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminBulkOperationDialog;
