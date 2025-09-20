import { deleteMyFeedback, getMyFeedback } from '@/services/APIService';
import {
  FeedbackStatus,
  type UserFeedbackListResponse,
} from '@/types/feedback';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Container,
  Link,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { type NextPage } from 'next';
import { useEffect, useState } from 'react';

const statusColors = {
  [FeedbackStatus.PENDING]: 'warning',
  [FeedbackStatus.IN_REVIEW]: 'info',
  [FeedbackStatus.IN_PROGRESS]: 'primary',
  [FeedbackStatus.RESOLVED]: 'success',
  [FeedbackStatus.CLOSED]: 'default',
  [FeedbackStatus.REJECTED]: 'error',
} as const;

const MyFeedbackPage: NextPage = () => {
  const [feedback, setFeedback] = useState<UserFeedbackListResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await getMyFeedback(page, 10);
      setFeedback(response);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to load your feedback';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteMyFeedback(id);
      // Reload feedback
      await loadFeedback();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to delete feedback';
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !feedback) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography color="text.primary">My Feedback</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            My Feedback
          </Typography>
          <Typography variant="h6" color="text.secondary">
            View and manage your submitted feedback.
          </Typography>
        </Box>
        <Button variant="contained" href="/feedback">
          Submit New Feedback
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Feedback Table */}
      {feedback && feedback.feedback.length > 0 ? (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedback.feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Chip
                        label={item.category.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 400,
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
                      <Typography variant="caption">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {feedback.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={feedback.pagination.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No feedback submitted yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Share your thoughts about Dojo Pool to help us improve the platform.
          </Typography>
          <Button variant="contained" href="/feedback">
            Submit Your First Feedback
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default MyFeedbackPage;
