import { Avatar, type AvatarProps, Box, type SxProps, Typography } from '@mui/material';
import React from 'react';

interface PlayerAvatarProps extends Omit<AvatarProps, 'src'> {
  playerName: string;
  avatarUrl?: string;
  level?: number;
  size?: 'small' | 'medium' | 'large';
  showLevel?: boolean;
  sx?: SxProps;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  playerName,
  avatarUrl,
  level = 1,
  size = 'medium',
  showLevel = true,
  sx,
  ...avatarProps
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 80;
      default:
        return 60;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return '0.75rem';
      case 'large':
        return '1.25rem';
      default:
        return '1rem';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...sx,
      }}
    >
      <Avatar
        src={avatarUrl}
        alt={playerName}
        sx={{
          width: getSizeValue(),
          height: getSizeValue(),
          fontSize: getFontSize(),
        }}
        {...avatarProps}
      >
        {!avatarUrl && playerName.charAt(0).toUpperCase()}
      </Avatar>
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          textAlign: 'center',
          fontSize: getFontSize(),
          fontWeight: 'medium',
        }}
      >
        {playerName}
      </Typography>
      {showLevel && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.7rem' }}
        >
          Level {level}
        </Typography>
      )}
    </Box>
  );
};

export default PlayerAvatar;
