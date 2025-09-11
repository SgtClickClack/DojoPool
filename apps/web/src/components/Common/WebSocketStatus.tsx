import { useWebSocketConnection } from '@/hooks/useWebSocket';
import {
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

interface WebSocketStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showDetails = false,
  compact = false,
}) => {
  const theme = useTheme();
  const {
    isConnected,
    connectionState,
    socketId,
    connectionHistory,
    getConnectionUptime,
    getReconnectionCount,
  } = useWebSocketConnection();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return theme.palette.success.main;
      case 'connecting':
        return theme.palette.warning.main;
      case 'reconnecting':
        return theme.palette.info.main;
      default:
        return theme.palette.error.main;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isConnected ? (
          <WifiIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />
        ) : (
          <WifiOffIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
        )}
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary }}
        >
          {isConnected ? 'Live' : 'Offline'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            boxShadow: `0 0 8px ${getStatusColor()}60`,
            animation:
              connectionState === 'connecting' ||
              connectionState === 'reconnecting'
                ? 'pulse 2s infinite'
                : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            },
          }}
        />
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          {getStatusText()}
        </Typography>
        {showDetails && (
          <Tooltip title="Connection Details">
            <IconButton size="small" onClick={handleClick} sx={{ p: 0.5 }}>
              <InfoIcon
                sx={{ fontSize: 16, color: theme.palette.text.secondary }}
              />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.text.primary }}
          >
            WebSocket Status
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText
                primary="Connection State"
                secondary={
                  <Chip
                    label={getStatusText()}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor() + '20',
                      color: getStatusColor(),
                      mt: 0.5,
                    }}
                  />
                }
              />
            </ListItem>

            {socketId && (
              <ListItem>
                <ListItemText
                  primary="Socket ID"
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {socketId}
                    </Typography>
                  }
                />
              </ListItem>
            )}

            {isConnected && (
              <ListItem>
                <ListItemText
                  primary="Connection Uptime"
                  secondary={formatUptime(getConnectionUptime())}
                />
              </ListItem>
            )}

            {getReconnectionCount() > 0 && (
              <ListItem>
                <ListItemText
                  primary="Reconnection Attempts"
                  secondary={`${getReconnectionCount()} times`}
                />
              </ListItem>
            )}

            <Divider sx={{ my: 1 }} />

            <ListItem>
              <ListItemText
                primary="Connection History"
                secondary={`${connectionHistory.length} events`}
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Last Activity"
                secondary={
                  connectionHistory.length > 0
                    ? new Date(
                        connectionHistory[
                          connectionHistory.length - 1
                        ].timestamp
                      ).toLocaleString()
                    : 'No activity'
                }
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton size="small" onClick={handleClose}>
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default WebSocketStatus;
