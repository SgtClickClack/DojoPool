import { Refresh as RefreshIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { getMyJournal } from '../../services/APIService';
import {
  JournalEntry as JournalEntryType,
  JournalResponse,
} from '../../types/journal';
import { generateMockJournalResponse } from '../../utils/mockJournalData';
import JournalEntry from './JournalEntry';

const JournalFeed: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadJournal = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        setError(null);
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        let response: JournalResponse;

        try {
          // Try to fetch from API first
          response = await getMyJournal(pageNum, 20);
        } catch (apiError) {
          // Fallback to mock data for development
          console.log('API not available, using mock data');
          response = generateMockJournalResponse(pageNum, 20);
        }

        if (append) {
          setEntries((prev) => [...prev, ...response.entries]);
        } else {
          setEntries(response.entries);
        }

        setHasMore(response.pagination.hasNext);
        setPage(pageNum);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load journal entries';
        setError(errorMessage);
        console.error('Error loading journal:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    loadJournal(1, false);
  }, [loadJournal]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadJournal(page + 1, true);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    loadJournal(1, false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (entries.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No journal entries yet
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Your journal will show your pool journey, achievements, and
          milestones.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Player Journal
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      <Box>
        {entries.map((entry) => (
          <JournalEntry key={entry.id} entry={entry} />
        ))}
      </Box>

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? <CircularProgress size={20} /> : 'Load More'}
          </Button>
        </Box>
      )}

      {!hasMore && entries.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 3, p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You've reached the end of your journal entries.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default JournalFeed;
