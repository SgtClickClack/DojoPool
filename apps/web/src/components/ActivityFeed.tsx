import { ActivityEventCard } from '@/components/ActivityEventCard';
import { getActivityFeed } from '@/services/APIService';
import { websocketService } from '@/services/WebSocketService';
import {
  type ActivityEvent,
  type ActivityFeedResponse,
} from '@/types/activity';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fade,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

interface ActivityFeedProps {
  filter: 'global' | 'friends';
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ filter }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    hasNext: false,
    hasPrev: false,
    total: 0,
  });

  const fetchEvents = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        const response: ActivityFeedResponse = await getActivityFeed(
          filter,
          page,
          20
        );

        if (append) {
          setEvents((prev) => [...prev, ...response.entries]);
        } else {
          setEvents(response.entries);
        }

        setPagination({
          page: response.pagination.page,
          hasNext: response.pagination.hasNext,
          hasPrev: response.pagination.hasPrev,
          total: response.pagination.total,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch activity feed'
        );
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  const loadMore = useCallback(() => {
    if (pagination.hasNext) {
      fetchEvents(pagination.page + 1, true);
    }
  }, [pagination.hasNext, pagination.page, fetchEvents]);

  const refresh = useCallback(() => {
    fetchEvents(1, false);
  }, [fetchEvents]);

  // Initial fetch
  useEffect(() => {
    fetchEvents(1, false);
  }, [fetchEvents]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const handleNewEvent = (data: any) => {
      if (data.type === 'new_activity_event') {
        const newEvent = data.data as ActivityEvent;

        // Only add if it matches the current filter or is global
        if (filter === 'global' || newEvent.isPublic) {
          setEvents((prev) => [newEvent, ...prev]);

          // Update pagination total
          setPagination((prev) => ({
            ...prev,
            total: prev.total + 1,
          }));
        }
      }
    };

    // Subscribe to WebSocket events
    const unsubscribe = websocketService.subscribe(
      'new_activity_event',
      handleNewEvent
    );

    return () => {
      unsubscribe();
    };
  }, [filter]);

  if (loading && events.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && events.length === 0) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={refresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with refresh button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          {filter === 'global' ? 'Global Activity' : 'Friends Activity'}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={refresh}
          disabled={loading}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Events list */}
      <Box>
        {events.map((event, index) => (
          <Fade in={true} timeout={300 + index * 100} key={event.id}>
            <Box>
              <ActivityEventCard event={event} />
            </Box>
          </Fade>
        ))}
      </Box>

      {/* Load more button */}
      {pagination.hasNext && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outlined"
            size="large"
          >
            {loading ? <CircularProgress size={20} /> : 'Load More'}
          </Button>
        </Box>
      )}

      {/* Empty state */}
      {events.length === 0 && !loading && !error && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No activity yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filter === 'global'
              ? 'Be the first to make some waves in the Dojo Pool world!'
              : "Your friends haven't been active yet. Encourage them to play!"}
          </Typography>
        </Box>
      )}

      {/* Total count */}
      {pagination.total > 0 && (
        <Box textAlign="center" mt={2}>
          <Typography variant="caption" color="text.secondary">
            Showing {events.length} of {pagination.total} events
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ActivityFeed;
