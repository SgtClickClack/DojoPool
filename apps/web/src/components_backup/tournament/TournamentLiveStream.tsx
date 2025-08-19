import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Chat,
  Visibility,
  Share,
  Favorite,
  FavoriteBorder,
  Fullscreen,
  VolumeUp,
  VolumeOff,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import tournamentStreamingService from '../../services/tournament/TournamentStreamingService';

interface TournamentLiveStreamProps {
  tournamentId: string;
  matchId: string;
  onStreamEnd?: () => void;
}

const CyberpunkCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
  border: `2px solid ${alpha('#00ff88', 0.3)}`,
  borderRadius: 12,
  boxShadow: `0 0 20px ${alpha('#00ff88', 0.2)}`,
  backdropFilter: 'blur(10px)',
}));

const NeonButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, #00ff88 30%, #00ccff 90%)`,
  border: 'none',
  borderRadius: 8,
  color: '#000',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: `0 0 15px ${alpha('#00ff88', 0.5)}`,
  '&:hover': {
    background: `linear-gradient(45deg, #00ff88 10%, #00ccff 100%)`,
    boxShadow: `0 0 25px ${alpha('#00ff88', 0.7)}`,
  },
}));

const StreamVideo = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 400,
  background: `linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)`,
  borderRadius: 12,
  border: `2px solid ${alpha('#00ff88', 0.3)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
}));

export const TournamentLiveStream: React.FC<TournamentLiveStreamProps> = ({
  tournamentId,
  matchId,
  onStreamEnd,
}) => {
  const theme = useTheme();
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamKey = `${tournamentId}_${matchId}`;

  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  useEffect(() => {
    const unsubscribe = tournamentStreamingService.subscribeToStream(
      streamKey,
      (data) => {
        if (data.type === 'stream_info') {
          setIsLive(data.data.isLive);
          setViewers(data.data.stats?.viewers || 0);
        } else if (data.type === 'stream_started') {
          setIsLive(true);
        } else if (data.type === 'stream_ended') {
          setIsLive(false);
          onStreamEnd?.();
        } else if (
          data.type === 'viewer_joined' ||
          data.type === 'viewer_left'
        ) {
          setViewers(data.viewerCount);
        }
      }
    );

    return unsubscribe;
  }, [streamKey, onStreamEnd]);

  const startStream = () => {
    const config = {
      quality: 'high' as const,
      fps: 60,
      resolution: '1920x1080',
      bitrate: 5000,
      enableAudio: true,
      enableCommentary: true,
      enableStats: true,
      enableReplay: true,
    };
    const success = tournamentStreamingService.startStream(
      tournamentId,
      matchId,
      config
    );
    if (success) {
      setIsLive(true);
    }
  };

  const stopStream = () => {
    const success = tournamentStreamingService.stopStream(
      tournamentId,
      matchId
    );
    if (success) {
      setIsLive(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        <Box sx={{ flex: { lg: 2 } }}>
          <CyberpunkCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={isLive ? 'LIVE' : 'OFFLINE'}
                  color={isLive ? 'success' : 'default'}
                  sx={{
                    background: isLive
                      ? neonColors.primary
                      : theme.palette.grey[600],
                    color: isLive ? '#000' : '#fff',
                    fontWeight: 'bold',
                    mr: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ color: neonColors.primary, flex: 1 }}
                >
                  Tournament Live Stream
                </Typography>
                <IconButton
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  sx={{ color: neonColors.info }}
                >
                  <Fullscreen />
                </IconButton>
              </Box>

              <StreamVideo>
                {isLive ? (
                  <Box sx={{ textAlign: 'center', color: neonColors.primary }}>
                    <Typography variant="h4" sx={{ mb: 2 }}>
                      🎱 LIVE MATCH
                    </Typography>
                    <Typography variant="body1">
                      Tournament Match in Progress
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {viewers} viewers watching
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{ textAlign: 'center', color: neonColors.secondary }}
                  >
                    <Typography variant="h4" sx={{ mb: 2 }}>
                      📺 Stream Offline
                    </Typography>
                    <Typography variant="body1">
                      Click "Start Stream" to begin broadcasting
                    </Typography>
                  </Box>
                )}
              </StreamVideo>

              <Box
                sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}
              >
                {!isLive ? (
                  <NeonButton
                    startIcon={<PlayArrow />}
                    onClick={startStream}
                    variant="contained"
                  >
                    Start Stream
                  </NeonButton>
                ) : (
                  <NeonButton
                    startIcon={<Stop />}
                    onClick={stopStream}
                    variant="contained"
                    sx={{
                      background: `linear-gradient(45deg, ${neonColors.error} 30%, ${neonColors.warning} 90%)`,
                    }}
                  >
                    Stop Stream
                  </NeonButton>
                )}

                <IconButton
                  onClick={() => setIsMuted(!isMuted)}
                  sx={{ color: neonColors.info }}
                >
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>

                <IconButton
                  onClick={() => setIsLiked(!isLiked)}
                  sx={{
                    color: isLiked ? neonColors.error : neonColors.secondary,
                  }}
                >
                  {isLiked ? <Favorite /> : <FavoriteBorder />}
                </IconButton>

                <IconButton sx={{ color: neonColors.info }}>
                  <Badge badgeContent={viewers} color="primary">
                    <Visibility />
                  </Badge>
                </IconButton>

                <IconButton sx={{ color: neonColors.info }}>
                  <Chat />
                </IconButton>

                <IconButton sx={{ color: neonColors.secondary }}>
                  <Share />
                </IconButton>
              </Box>

              {isLive && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: neonColors.info, mb: 1 }}
                  >
                    Stream Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        sx={{ color: neonColors.primary }}
                      >
                        {viewers}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        Viewers
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        sx={{ color: neonColors.warning }}
                      >
                        {isLiked ? 1 : 0}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        Likes
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: neonColors.error }}>
                        0
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        Shares
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        sx={{ color: neonColors.secondary }}
                      >
                        LIVE
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        Status
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </CyberpunkCard>
        </Box>

        <Box sx={{ flex: { lg: 1 } }}>
          <CyberpunkCard>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ color: neonColors.primary, mb: 2 }}
              >
                Stream Info
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                Tournament: Tournament Name
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                Match: Player 1 vs Player 2
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                Venue: Venue Name
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 2 }}
              >
                Quality: 1080p @ 60fps
              </Typography>

              <Typography
                variant="h6"
                sx={{ color: neonColors.warning, mb: 2 }}
              >
                Live Commentary
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    textAlign: 'center',
                    py: 2,
                  }}
                >
                  Commentary will appear here during the stream...
                </Typography>
              </Box>
            </CardContent>
          </CyberpunkCard>
        </Box>
      </Box>
    </Box>
  );
};
