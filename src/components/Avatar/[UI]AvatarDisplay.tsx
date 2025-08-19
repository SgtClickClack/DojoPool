import EditIcon from '@mui/icons-material/Edit';
import { Badge, IconButton, Avatar as MuiAvatar, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

export interface AvatarDisplayProps {
  avatarUrl?: string | null;
  username: string;
  size?: number;
  editable?: boolean;
  onEdit?: () => void;
  showStatus?: boolean;
  isOnline?: boolean;
  className?: string;
}

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const EditBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.background.paper,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: 0,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarUrl,
  username,
  size = 40,
  editable = false,
  onEdit,
  showStatus = false,
  isOnline = false,
  className,
}) => {
  const avatarComponent = (
    <MuiAvatar
      src={avatarUrl || undefined}
      alt={username}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: !avatarUrl ? 'primary.main' : undefined,
      }}
    >
      {!avatarUrl && username.charAt(0).toUpperCase()}
    </MuiAvatar>
  );

  // Wrap with online status badge if needed
  const statusAvatar = showStatus ? (
    <StyledBadge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
      invisible={!isOnline}
    >
      {avatarComponent}
    </StyledBadge>
  ) : (
    avatarComponent
  );

  // Wrap with edit badge if editable
  const editableAvatar = editable ? (
    <EditBadge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <Tooltip title="Edit Avatar">
          <IconButton
            onClick={onEdit}
            size="small"
            sx={{
              width: size * 0.4,
              height: size * 0.4,
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <EditIcon sx={{ fontSize: size * 0.25 }} />
          </IconButton>
        </Tooltip>
      }
    >
      {statusAvatar}
    </EditBadge>
  ) : (
    statusAvatar
  );

  return (
    <div className={className} style={{ display: 'inline-block' }}>
      {editableAvatar}
    </div>
  );
};

export default AvatarDisplay;

export const AnimatedAvatar = AvatarDisplay;
