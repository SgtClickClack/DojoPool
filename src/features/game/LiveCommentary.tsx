import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
} from '@mui/material';

interface CommentaryEvent {
  id: string;
  timestamp: string;
  text: string;
  audioUrl?: string;
}

interface LiveCommentaryProps {
  gameId: string;
}

const LiveCommentary: React.FC<LiveCommentaryProps> = ({ gameId }) => {
  const [events, setEvents] = useState<CommentaryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    setLoading(true);
    setError(null);
    setEvents([]);
    try {
      ws = new WebSocket(`/api/games/${gameId}/commentary`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.text) {
            setEvents((prev) => [data, ...prev.slice(0, 9)]); // Keep last 10 events
            if (data.audioUrl && audioRef.current) {
              audioRef.current.src = data.audioUrl;
              audioRef.current.play();
            }
          }
          setLoading(false);
        } catch (e) {
          setError('Invalid commentary data received');
        }
      };
      ws.onerror = () => setError('Commentary connection error');
      ws.onclose = () => setError('Commentary connection closed');
    } catch (e) {
      setError('Failed to connect to commentary server');
    }
    return () => {
      if (ws) ws.close();
    };
  }, [gameId]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={120}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (events.length === 0) {
    return <Typography>No commentary yet.</Typography>;
  }

  const latest = events[0];

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Live Commentary
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        {latest.text}
      </Typography>
      {latest.audioUrl && (
        <audio
          ref={audioRef}
          controls
          src={latest.audioUrl}
          style={{ width: '100%' }}
        />
      )}
      <List dense>
        {events.slice(1).map((ev) => (
          <ListItem key={ev.id}>
            <Typography variant="body2" color="textSecondary">
              [{new Date(ev.timestamp).toLocaleTimeString()}] {ev.text}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default LiveCommentary;
