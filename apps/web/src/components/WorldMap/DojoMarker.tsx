import { Group, LocationOn, Shield } from '@mui/icons-material';
import { Avatar, Box, Chip, Paper, Typography } from '@mui/material';
import React from 'react';

interface DojoMarkerProps {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  currentController?: {
    name: string;
    avatarUrl?: string;
    level: number;
  };
  memberCount: number;
  maxCapacity: number;
  status: 'available' | 'occupied' | 'at-war' | 'maintenance';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  specialFeatures: string[];
  onChallenge?: (dojoId: string) => void;
  onView?: (dojoId: string) => void;
}

const DojoMarker: React.FC<DojoMarkerProps> = ({
  id,
  name,
  description,
  location,
  currentController,
  memberCount,
  maxCapacity,
  status,
  difficulty,
  specialFeatures,
  onChallenge,
  onView,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'warning';
      case 'at-war':
        return 'error';
      case 'maintenance':
        return 'default';
      default:
        return 'info';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'at-war':
        return 'At War';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'info';
      case 'advanced':
        return 'warning';
      case 'expert':
        return 'error';
      default:
        return 'default';
    }
  };

  const isAvailable = status === 'available';
  const isFull = memberCount >= maxCapacity;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        minWidth: 280,
        maxWidth: 320,
        cursor: 'pointer',
        '&:hover': {
          elevation: 6,
          transform: 'scale(1.02)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 1,
        }}
      >
        <Typography variant="h6" component="h3" gutterBottom>
          {name}
        </Typography>
        <Chip
          label={getStatusText()}
          color={getStatusColor() as any}
          size="small"
        />
      </Box>

      {/* Description */}
      <Typography variant="body2" color="text.secondary" paragraph>
        {description}
      </Typography>

      {/* Location */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LocationOn fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          {location.address}
        </Typography>
      </Box>

      {/* Current Controller */}
      {currentController && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Shield fontSize="small" color="action" />
          <Avatar
            src={currentController.avatarUrl}
            sx={{ width: 20, height: 20, fontSize: '0.75rem' }}
          >
            {!currentController.avatarUrl &&
              currentController.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            Controlled by {currentController.name} (Level{' '}
            {currentController.level})
          </Typography>
        </Box>
      )}

      {/* Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Group fontSize="small" color="action" />
          <Typography variant="body2">
            {memberCount}/{maxCapacity}
          </Typography>
        </Box>
        <Chip
          label={difficulty}
          color={getDifficultyColor() as any}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Special Features */}
      {specialFeatures.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Features:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {specialFeatures.map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box
          component="button"
          onClick={() => onView?.(id)}
          sx={{
            flex: 1,
            p: 1,
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 1,
            backgroundColor: 'transparent',
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
            },
          }}
        >
          View Details
        </Box>

        {isAvailable && !isFull && (
          <Box
            component="button"
            onClick={() => onChallenge?.(id)}
            sx={{
              flex: 1,
              p: 1,
              border: 'none',
              borderRadius: 1,
              backgroundColor: 'success.main',
              color: 'white',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'success.dark',
              },
            }}
          >
            Challenge
          </Box>
        )}

        {!isAvailable && (
          <Box
            sx={{
              flex: 1,
              p: 1,
              border: '1px solid',
              borderColor: 'text.disabled',
              borderRadius: 1,
              backgroundColor: 'action.disabledBackground',
              color: 'text.disabled',
              textAlign: 'center',
            }}
          >
            {status === 'maintenance' ? 'Under Maintenance' : 'Unavailable'}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DojoMarker;
