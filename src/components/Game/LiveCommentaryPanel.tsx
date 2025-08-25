import {
  AutoAwesome,
  Refresh,
  SportsEsports,
  VolumeOff,
  VolumeUp,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useRef } from 'react';

interface CommentaryMessage {
  id: string;
  message: string;
  timestamp: Date;
  type: 'shot' | 'foul' | 'achievement' | 'general';
}

interface LiveCommentaryPanelProps {
  commentary: CommentaryMessage[];
  isConnected: boolean;
  onRefresh?: () => void;
}

const CyberpunkPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  border: '2px solid #00d4ff',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
    animation: 'scanline 2s linear infinite',
  },
  '@keyframes scanline': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
}));

const CommentaryItem = styled(ListItem)(({ theme }) => ({
  background: 'rgba(0, 212, 255, 0.05)',
  margin: '8px 0',
  borderRadius: '8px',
  border: '1px solid rgba(0, 212, 255, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(0, 212, 255, 0.1)',
    border: '1px solid rgba(0, 212, 255, 0.4)',
    transform: 'translateX(4px)',
  },
}));

const LiveCommentaryPanel: React.FC<LiveCommentaryPanelProps> = ({
  commentary,
  isConnected,
  onRefresh,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);

  // Auto-scroll to bottom when new commentary arrives
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [commentary]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'shot':
        return <SportsEsports sx={{ color: '#00d4ff' }} />;
      case 'foul':
        return <AutoAwesome sx={{ color: '#ff6b6b' }} />;
      case 'achievement':
        return <AutoAwesome sx={{ color: '#4ecdc4' }} />;
      default:
        return <AutoAwesome sx={{ color: '#fdcb6e' }} />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'shot':
        return '#00d4ff';
      case 'foul':
        return '#ff6b6b';
      case 'achievement':
        return '#4ecdc4';
      default:
        return '#fdcb6e';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <CyberpunkPaper elevation={8}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsEsports sx={{ color: '#00d4ff', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                color: '#00d4ff',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
              }}
            >
              AI Commentary
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
              <IconButton
                size="small"
                onClick={() => setIsMuted(!isMuted)}
                sx={{ color: isMuted ? '#666' : '#00d4ff' }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Tooltip>

            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  sx={{ color: '#00d4ff' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Connection Status */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            sx={{
              background: isConnected
                ? 'rgba(76, 175, 80, 0.2)'
                : 'rgba(244, 67, 54, 0.2)',
              border: `1px solid ${isConnected ? '#4caf50' : '#f44336'}`,
              color: isConnected ? '#4caf50' : '#f44336',
            }}
          />
        </Box>

        {/* Commentary List */}
        <Box
          ref={listRef}
          sx={{
            maxHeight: '400px',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 212, 255, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(0, 212, 255, 0.7)',
              },
            },
          }}
        >
          {commentary.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AutoAwesome
                sx={{ fontSize: 48, color: 'rgba(0, 212, 255, 0.3)', mb: 2 }}
              />
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                {isConnected
                  ? 'Waiting for AI commentary...'
                  : 'Connect to receive live commentary'}
              </Typography>
            </Box>
          ) : (
            <List dense>
              {commentary.map((item, index) => (
                <CommentaryItem key={item.id || index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      width: '100%',
                    }}
                  >
                    {getMessageIcon(item.type)}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#ffffff',
                              fontWeight: 500,
                              lineHeight: 1.4,
                            }}
                          >
                            {item.message}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {formatTimestamp(item.timestamp)}
                          </Typography>
                        }
                      />
                    </Box>
                    <Chip
                      label={item.type}
                      size="small"
                      sx={{
                        background: `rgba(${getMessageColor(item.type)}, 0.2)`,
                        border: `1px solid ${getMessageColor(item.type)}`,
                        color: getMessageColor(item.type),
                        fontSize: '0.7rem',
                        height: '20px',
                      }}
                    />
                  </Box>
                </CommentaryItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 212, 255, 0.2)' }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            Powered by AI • {commentary.length} messages
          </Typography>
        </Box>
      </Box>
    </CyberpunkPaper>
  );
};

export default LiveCommentaryPanel;
