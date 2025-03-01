import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  AccessTime as PendingIcon,
  Delete as ClearIcon,
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as SwapIcon,
  LocalAtm as MoneyIcon,
  Visibility as ViewAllIcon
} from '@mui/icons-material';
import { 
  subscribeToNotifications, 
  getRecentNotifications, 
  getUnreadNotificationCount, 
  markAllNotificationsAsRead,
  WalletNotificationData,
  WalletNotificationType
} from '../../utils/walletNotifications';

interface WalletNotificationsMenuProps {
  maxItems?: number;
  showViewAll?: boolean;
  onViewAllClick?: () => void;
}

const WalletNotificationsMenu: React.FC<WalletNotificationsMenuProps> = ({
  maxItems = 5,
  showViewAll = true,
  onViewAllClick
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<WalletNotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    // Mark notifications as read when opening the menu
    markAllNotificationsAsRead();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAll = () => {
    handleClose();
    if (onViewAllClick) {
      onViewAllClick();
    }
  };

  // Subscribe to notifications
  useEffect(() => {
    setLoading(true);
    
    // Get initial notifications
    const initialNotifications = getRecentNotifications();
    setNotifications(initialNotifications);
    setUnreadCount(getUnreadNotificationCount());
    setLoading(false);
    
    // Subscribe to notification updates
    const unsubscribe = subscribeToNotifications((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(getUnreadNotificationCount());
    });
    
    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, []);

  // Get notification icon based on type
  const getNotificationIcon = (notification: WalletNotificationData) => {
    const { title } = notification;
    
    if (title.includes('Connected') || title.includes('Account Changed')) {
      return <WalletIcon fontSize="small" color="primary" />;
    }
    
    if (title.includes('Transaction Pending')) {
      return <PendingIcon fontSize="small" color="warning" />;
    }
    
    if (title.includes('Transaction Successful') || title.includes('Signature Completed')) {
      return <SuccessIcon fontSize="small" color="success" />;
    }
    
    if (title.includes('Failed') || title.includes('Error')) {
      return <ErrorIcon fontSize="small" color="error" />;
    }
    
    if (title.includes('Network Changed')) {
      return <SwapIcon fontSize="small" color="primary" />;
    }
    
    if (title.includes('Balance')) {
      return <MoneyIcon fontSize="small" color="primary" />;
    }
    
    return <InfoIcon fontSize="small" color="info" />;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Filter and limit notifications
  const visibleNotifications = notifications.slice(0, maxItems);
  const hasNotifications = notifications.length > 0;
  
  return (
    <>
      <Tooltip title="Wallet Notifications">
        <IconButton 
          onClick={handleOpen}
          size="large"
          aria-label="show wallet notifications"
          color="inherit"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: { 
            width: 320,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">Wallet Notifications</Typography>
          
          {hasNotifications && (
            <Tooltip title="Clear all notifications">
              <IconButton size="small" onClick={() => setNotifications([])}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : !hasNotifications ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <WalletIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No wallet notifications
            </Typography>
          </Box>
        ) : (
          <>
            <List dense disablePadding>
              {visibleNotifications.map((notification) => (
                <ListItem 
                  key={notification.timestamp}
                  divider 
                  sx={{ 
                    py: 1,
                    backgroundColor: notification.read ? 'inherit' : 'action.hover'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getNotificationIcon(notification)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" display="block">
                          {notification.message}
                        </Typography>
                        {notification.txHash && (
                          <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                            TX: {notification.txHash.substring(0, 8)}...
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            {showViewAll && notifications.length > maxItems && (
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  startIcon={<ViewAllIcon />} 
                  size="small" 
                  onClick={handleViewAll}
                >
                  View All ({notifications.length})
                </Button>
              </Box>
            )}
          </>
        )}
      </Menu>
    </>
  );
};

export default WalletNotificationsMenu; 