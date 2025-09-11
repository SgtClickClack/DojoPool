import {
  getModerationFeedbackById,
  updateModerationFeedbackStatus,
} from '@/services/APIService';
import type { Feedback } from '@dojopool/types';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

// Define enums locally
enum FeedbackStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  DISMISSED = 'DISMISSED',
}

enum FeedbackPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

interface ReportDetailsProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

const ReportDetails: React.FC<ReportDetailsProps> = ({ id, open, onClose }) => {
  const [report, setReport] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FeedbackStatus | ''>('');
  const [priority, setPriority] = useState<FeedbackPriority | ''>('');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const item = await getModerationFeedbackById(id);
        setReport(item);
        setStatus(item.status as any as FeedbackStatus);
        setPriority(item.priority as any as FeedbackPriority);
        setModeratorNotes(item.moderatorNotes || '');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load report');
      }
    };
    if (open) void load();
  }, [id, open]);

  const save = async () => {
    if (!report || !status) return;
    try {
      setSaving(true);
      await updateModerationFeedbackStatus(report.id, {
        status: status as any,
        priority: priority as any,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Report Details</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {report && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Submitted
              </Typography>
              <Typography variant="body2">
                {new Date(report.createdAt).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                User
              </Typography>
              <Typography variant="body2">{report.user?.username}</Typography>
              <Typography variant="caption" color="text.secondary">
                {report.user?.email}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Message
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {report.message}
              </Typography>
            </Box>
            {Array.isArray(report.attachments) &&
              report.attachments.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Attachments
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {report.attachments.map((url) => (
                      <Chip
                        key={url}
                        label={url.split('/').slice(-1)[0]}
                        component="a"
                        href={url}
                        clickable
                        target="_blank"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
                >
                  {
                    Object.values(
                      (report as any).status?.constructor ?? (Object as any)
                    ) /* fallback */
                  }
                  {Object.values(FeedbackStatus as any)
                    .filter((v) => typeof v === 'string')
                    .map((s) => (
                      <MenuItem key={s} value={s}>
                        {String(s).replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as FeedbackPriority)
                  }
                >
                  {Object.values(FeedbackPriority as any)
                    .filter((v) => typeof v === 'string')
                    .map((p) => (
                      <MenuItem key={p} value={p}>
                        {String(p)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Moderator Notes"
              multiline
              rows={4}
              fullWidth
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={save} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDetails;
