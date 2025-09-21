import {
  Add as AddIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import React from 'react';

interface EventManagementHeaderProps {
  onCreateEvent: () => void;
}

const EventManagementHeader: React.FC<EventManagementHeaderProps> = ({
  onCreateEvent,
}) => {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6" component="h2">
        Event Management
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateEvent}
      >
        Create Event
      </Button>
    </Box>
  );
};

export default EventManagementHeader;
