import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Share,
  Download,
  MoreVert,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useUser } from '../hooks/useUser';
import { useVideoHighlights } from '../hooks/useVideoHighlights';

interface VideoHighlightsProps {
  tournamentId: string;
}

const VideoHighlights: React.FC<VideoHighlightsProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const { user } = useUser();
  const { highlights, generateHighlight, shareHighlight, downloadHighlight } = useVideoHighlights();
  const [selectedHighlight, setSelectedHighlight] = React.useState<string | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateHighlight = async () => {
    if (!tournament || !user) return;

    setGenerating(true);
    setError(null);

    try {
      await generateHighlight({
        tournamentId,
        userId: user.id,
        gameType: tournament.type,
        highlights: [
          'best_shot',
          'highest_score',
          'most_dramatic_moment',
          'team_play',
        ],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate highlights'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async (highlightId: string) => {
    try {
      await shareHighlight(highlightId);
      setDialogOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to share highlight'
      );
    }
  };

  const handleDownload = async (highlightId: string) => {
    try {
      await downloadHighlight(highlightId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to download highlight'
      );
    }
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleTimeUpdate = (event: React.ChangeEvent<HTMLVideoElement>) => {
    setCurrentTime(event.target.currentTime);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedHighlight && highlights[selectedHighlight]?.videoRef) {
      highlights[selectedHighlight].videoRef.current.currentTime = Number(event.target.value);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tournament Highlights
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Details
          </Typography>
          <Typography variant="body1">
            Name: {tournament.name}
          </Typography>
          <Typography variant="body1">
            Type: {tournament.type.replace('_', ' ')}
          </Typography>
          <Typography variant="body1">
            Status: {tournament.status}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {Object.entries(highlights).map(([highlightId, highlight]) => (
          <Grid item xs={12} md={6} key={highlightId}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 0,
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    overflow: 'hidden',
                  }}
                >
                  <video
                    ref={highlight.videoRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onTimeUpdate={handleTimeUpdate}
                  >
                    <source src={highlight.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 2,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <IconButton
                        onClick={handlePlayPause}
                        color="primary"
                      >
                        {playing ? <Pause /> : <PlayArrow />}
                      </IconButton>
                      <IconButton
                        onClick={() => setSelectedHighlight(highlightId)}
                        color="primary"
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="white">
                        {Math.floor(currentTime)}s
                      </Typography>
                      <input
                        type="range"
                        min="0"
                        max={highlight.duration}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{
                          width: '100%',
                          height: 4,
                          backgroundColor: 'white',
                          borderRadius: 2,
                          outline: 'none',
                          WebkitAppearance: 'none',
                        }}
                      />
                      <Typography variant="body2" color="white">
                        {Math.floor(highlight.duration)}s
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {highlight.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {highlight.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        onClick={handleGenerateHighlight}
        disabled={generating}
        sx={{ mt: 3 }}
      >
        {generating ? (
          <>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            Generating Highlights...
          </>
        ) : (
          'Generate Highlights'
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleShare(selectedHighlight!)}>
          <Share sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={() => handleDownload(selectedHighlight!)}>
          <Download sx={{ mr: 1 }} />
          Download
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Highlight Shared Successfully</DialogTitle>
        <DialogContent>
          <Typography>
            Your highlight has been shared to your social media accounts.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default VideoHighlights;
