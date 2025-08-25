import {
  AutoAwesome,
  Mic,
  Refresh,
  VolumeOff,
  VolumeUp,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Fade,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useLiveCommentary } from '../../frontend/hooks/useLiveCommentary';

interface LiveCommentaryPanelProps {
  gameId: string;
  isActive?: boolean;
  onCommentaryUpdate?: (commentary: {
    id: string;
    text: string;
    timestamp: number;
    style?: string;
  }) => void;
}

export const LiveCommentaryPanel: React.FC<LiveCommentaryPanelProps> = ({
  gameId,
  isActive = true,
  onCommentaryUpdate: _onCommentaryUpdate,
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { commentaryEntries, isConnected, error, clearCommentary } =
    useLiveCommentary({ gameId, isActive });

  // Auto-scroll to bottom when new commentary arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commentaryEntries]);

  const handleAudioToggle = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleRefresh = () => {
    clearCommentary();
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStyleColor = (style?: string) => {
    switch (style) {
      case 'excited':
        return '#ff6b6b';
      case 'analytical':
        return '#4ecdc4';
      case 'casual':
        return '#45b7d1';
      default:
        return '#00a8ff';
    }
  };

  if (!isActive) {
    return (
      <Paper
        sx={{
          background: 'rgba(26, 26, 26, 0.95)',
          border: '2px solid #333',
          borderRadius: 3,
          p: 3,
          textAlign: 'center',
          opacity: 0.6,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Commentary Panel Inactive
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        background:
          'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)',
        border: '2px solid #00a8ff',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(0, 168, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #00a8ff, #00ff9d, #00a8ff)',
          animation: 'scanline 3s linear infinite',
        },
        '@keyframes scanline': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(90deg, #00a8ff, #00ff9d)',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Mic sx={{ color: 'white' }} />
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            AI COMMENTARY
          </Typography>
          <Chip
            label={isConnected ? 'LIVE' : 'OFFLINE'}
            size="small"
            sx={{
              background: isConnected ? '#00ff9d' : '#ff6b6b',
              color: 'white',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Box>

        <Box display="flex" gap={1}>
          <Tooltip title={isAudioEnabled ? 'Disable Audio' : 'Enable Audio'}>
            <IconButton
              onClick={handleAudioToggle}
              sx={{
                color: 'white',
                '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              {isAudioEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Commentary">
            <IconButton
              onClick={handleRefresh}
              sx={{
                color: 'white',
                '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Commentary Content */}
      <Box
        ref={scrollRef}
        sx={{
          maxHeight: '400px',
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #00a8ff, #00ff9d)',
            borderRadius: '4px',
          },
        }}
      >
        {error && (
          <Box
            sx={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid #ff6b6b',
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >
            <Typography variant="body2" color="#ff6b6b">
              {error}
            </Typography>
          </Box>
        )}

        {commentaryEntries.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <AutoAwesome sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              Waiting for AI commentary...
            </Typography>
          </Box>
        ) : (
          commentaryEntries.map((entry, index) => (
            <Fade
              key={entry.id}
              in={true}
              timeout={500 + index * 100}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  background: entry.isNew
                    ? 'rgba(0, 168, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: entry.isNew
                    ? '1px solid rgba(0, 168, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 168, 255, 0.2)',
                  },
                }}
              >
                {entry.isNew && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                      borderRadius: 3,
                      zIndex: -1,
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    lineHeight: 1.6,
                    fontFamily: 'Inter, sans-serif',
                    mb: 1,
                  }}
                >
                  {entry.text}
                </Typography>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Chip
                    label={entry.style || 'professional'}
                    size="small"
                    sx={{
                      background: getStyleColor(entry.style),
                      color: 'white',
                      fontSize: '0.7rem',
                      fontFamily: 'Orbitron, monospace',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '0.7rem',
                    }}
                  >
                    {formatTimestamp(entry.timestamp)}
                  </Typography>
                </Box>
              </Box>
            </Fade>
          ))
        )}
      </Box>

      {/* Audio element for commentary audio */}
      <audio ref={audioRef} hidden />
    </Paper>
  );
};
