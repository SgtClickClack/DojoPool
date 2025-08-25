import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { Badge, Box, IconButton, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationPanel from './NotificationPanel';

const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                height: '20px',
                minWidth: '20px',
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationPanel
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
      />
    </Box>
  );
};

export default NotificationBell;
