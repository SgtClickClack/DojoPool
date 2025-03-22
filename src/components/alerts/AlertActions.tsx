import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';
import { Alert } from '../../types/alert';

interface AlertActionsProps {
  alert: Alert;
  isMobile?: boolean;
}

export const AlertActions: React.FC<AlertActionsProps> = ({ alert, isMobile = false }) => {
  const buttonSize = isMobile ? 'small' : 'medium';
  const iconSize = isMobile ? 'small' : 'medium';

  const handleAcknowledge = () => {
    // TODO: Implement acknowledge action
  };

  const handleDismiss = () => {
    // TODO: Implement dismiss action
  };

  const handleFlag = () => {
    // TODO: Implement flag action
  };

  return (
    <Box 
      display="flex" 
      gap={isMobile ? 0.5 : 1}
      justifyContent={isMobile ? 'flex-end' : 'flex-start'}
      sx={{ 
        '& .MuiIconButton-root': {
          p: isMobile ? 0.5 : 1
        }
      }}
    >
      {alert.status === 'ACTIVE' && (
        <Tooltip title="Acknowledge">
          <IconButton
            aria-label="Acknowledge alert"
            color="primary"
            size={buttonSize}
            onClick={handleAcknowledge}
          >
            <DoneIcon fontSize={iconSize} />
          </IconButton>
        </Tooltip>
      )}
      {alert.status !== 'DISMISSED' && (
        <Tooltip title="Dismiss">
          <IconButton
            aria-label="Dismiss alert"
            color="error"
            size={buttonSize}
            onClick={handleDismiss}
          >
            <CloseIcon fontSize={iconSize} />
          </IconButton>
        </Tooltip>
      )}
      {alert.status !== 'DISMISSED' && (
        <Tooltip title="Flag for review">
          <IconButton
            aria-label="Flag alert for review"
            color="warning"
            size={buttonSize}
            onClick={handleFlag}
          >
            <FlagIcon fontSize={iconSize} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}; 