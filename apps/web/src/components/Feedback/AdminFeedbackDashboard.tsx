import {
  getAllFeedback,
  getFeedbackStats,
  updateFeedback,
} from '@/services/APIService';
import {
  type Feedback,
  type FeedbackFilter,
  type FeedbackListResponse,
  FeedbackPriority,
  type FeedbackStats,
  FeedbackStatus,
} from '@/types/feedback';
import { Alert, Box, CircularProgress, Pagination, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { withErrorBoundary } from '@/components/ErrorBoundary/withErrorBoundary';
import FeedbackStatsCards from './AdminFeedbackDashboard/FeedbackStatsCards';
import FeedbackFilters from './AdminFeedbackDashboard/FeedbackFilters';
import FeedbackTable from './AdminFeedbackDashboard/FeedbackTable';
import FeedbackUpdateDialog from './AdminFeedbackDashboard/FeedbackUpdateDialog';

interface AdminFeedbackDashboardProps {
  onFeedbackUpdated?: () => void;
}

export const AdminFeedbackDashboard: React.FC<AdminFeedbackDashboardProps> = ({
  onFeedbackUpdated,
}) => {
  const [feedback, setFeedback] = useState<FeedbackListResponse | null>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedbackFilter>({});
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const [feedbackResponse, statsResponse] = await Promise.all([
        getAllFeedback(filters, page, 20),
        getFeedbackStats(),
      ]);
      setFeedback(feedbackResponse);
      setStats(statsResponse);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to load feedback';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [filters, page]);

  const handleStatusUpdate = async (
    id: string,
    status: FeedbackStatus,
    adminNotes?: string
  ) => {
    setUpdating(true);
    try {
      const updatedFeedback = await updateFeedback(id, { status, adminNotes });
      setFeedback((prev) =>
        prev
          ? {
              ...prev,
              feedback: prev.feedback.map((f) =>
                f.id === id ? updatedFeedback : f
              ),
            }
          : null
      );
      setUpdateDialogOpen(false);
      setSelectedFeedback(null);
      onFeedbackUpdated?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to update feedback';
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityUpdate = async (
    id: string,
    priority: FeedbackPriority
  ) => {
    try {
      const updatedFeedback = await updateFeedback(id, { priority });
      setFeedback((prev) =>
        prev
          ? {
              ...prev,
              feedback: prev.feedback.map((f) =>
                f.id === id ? updatedFeedback : f
              ),
            }
          : null
      );
      onFeedbackUpdated?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to update priority';
      setError(errorMessage);
    }
  };

  const handleUpdateFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = () => {
    if (selectedFeedback) {
      handleStatusUpdate(
        selectedFeedback.id,
        selectedFeedback.status,
        selectedFeedback.adminNotes
      );
    }
  };

  if (loading && !feedback) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Feedback Management Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {stats && <FeedbackStatsCards stats={stats} />}

      <FeedbackFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <Paper>
        <FeedbackTable
          feedback={feedback?.feedback || []}
          onPriorityUpdate={handlePriorityUpdate}
          onUpdateFeedback={handleUpdateFeedback}
        />
      </Paper>

      {feedback && feedback.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={feedback.pagination.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      <FeedbackUpdateDialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        onSubmit={handleSubmitUpdate}
        selectedFeedback={selectedFeedback}
        onSelectedFeedbackChange={setSelectedFeedback}
        updating={updating}
      />
    </Box>
  );
};

export default withErrorBoundary(AdminFeedbackDashboard, {
  componentName: 'AdminFeedbackDashboard',
  showRetry: true,
  showHome: true,
  showReport: true,
});