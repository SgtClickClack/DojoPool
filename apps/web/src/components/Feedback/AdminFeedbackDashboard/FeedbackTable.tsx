import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import {
  Feedback,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackCategory,
} from '@/types/feedback';

const statusColors = {
  [FeedbackStatus.PENDING]: 'warning',
  [FeedbackStatus.IN_REVIEW]: 'info',
  [FeedbackStatus.IN_PROGRESS]: 'primary',
  [FeedbackStatus.RESOLVED]: 'success',
  [FeedbackStatus.CLOSED]: 'default',
  [FeedbackStatus.REJECTED]: 'error',
} as const;

const priorityColors = {
  [FeedbackPriority.LOW]: 'default',
  [FeedbackPriority.NORMAL]: 'info',
  [FeedbackPriority.HIGH]: 'warning',
  [FeedbackPriority.CRITICAL]: 'error',
} as const;

const categoryLabels = {
  [FeedbackCategory.BUG]: '🐛 Bug',
  [FeedbackCategory.FEATURE_REQUEST]: '💡 Feature',
  [FeedbackCategory.GENERAL_FEEDBACK]: '💬 Feedback',
  [FeedbackCategory.VENUE_ISSUE]: '🏢 Venue',
  [FeedbackCategory.TECHNICAL_SUPPORT]: '🛠️ Support',
  [FeedbackCategory.UI_UX_IMPROVEMENT]: '🎨 UI/UX',
  [FeedbackCategory.PERFORMANCE_ISSUE]: '⚡ Performance',
};

interface FeedbackTableProps {
  feedback: Feedback[];
  onPriorityUpdate: (id: string, priority: FeedbackPriority) => void;
  onUpdateFeedback: (feedback: Feedback) => void;
}

const FeedbackTable: React.FC<FeedbackTableProps> = ({
  feedback,
  onPriorityUpdate,
  onUpdateFeedback,
}) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {feedback.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {item.user.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.user.email}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={categoryLabels[item.category]}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.message}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={item.status.replace('_', ' ')}
                  color={statusColors[item.status]}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <FormControl size="small">
                  <Select
                    value={item.priority}
                    onChange={(e) =>
                      onPriorityUpdate(
                        item.id,
                        e.target.value as FeedbackPriority
                      )
                    }
                    size="small"
                  >
                    {Object.values(FeedbackPriority).map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        <Chip
                          label={priority}
                          color={priorityColors[priority]}
                          size="small"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onUpdateFeedback(item)}
                >
                  Update
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FeedbackTable;
