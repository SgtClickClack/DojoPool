import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DirectionsWalk,
  DirectionsCar,
  DirectionsBus,
  LocationOn,
  Timer,
  Speed,
  Cancel,
  CheckCircle,
  Warning,
  Info,
  Close,
  Navigation,
  AccessTime
} from '@mui/icons-material';

interface PlayerMovementPanelProps {
  currentLocation: {
    latitude: number;
    longitude: number;
    dojoId?: string;
    dojoName?: string;
  };
  onTravelStarted?: (movement: any) => void;
  onTravelCompleted?: (movement: any) => void;
  onTravelCancelled?: (movement: any) => void;
  onClose?: () => void;
}

interface TravelOption {
  method: 'walking' | 'driving' | 'public_transport';
  duration: number; // minutes
  cost: number;
  icon: React.ReactNode;
  color: string;
}

interface NearbyDojo {
  id: string;
  name: string;
  distance: number; // km
  latitude: number;
  longitude: number;
  status: 'available' | 'controlled' | 'locked';
  controller?: string;
}

const PlayerMovementPanel: React.FC<PlayerMovementPanelProps> = ({
  currentLocation,
  onTravelStarted,
  onTravelCompleted,
  onTravelCancelled,
  onClose
}) => {
  const [isTraveling, setIsTraveling] = useState(false);
  const [currentMovement, setCurrentMovement] = useState<any>(null);
  const [travelProgress, setTravelProgress] = useState(0);
  const [showTravelDialog, setShowTravelDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<NearbyDojo | null>(null);
  const [selectedTravelMethod, setSelectedTravelMethod] = useState<'walking' | 'driving' | 'public_transport'>('walking');
  const [nearbyDojos, setNearbyDojos] = useState<NearbyDojo[]>([]);

  // Mock nearby dojos
  const mockNearbyDojos: NearbyDojo[] = [
    {
      id: 'dojo-1',
      name: 'The Empire Hotel',
      distance: 0.2,
      latitude: -27.4698,
      longitude: 153.0251,
      status: 'available'
    },
    {
      id: 'dojo-2',
      name: 'The Wickham',
      distance: 0.8,
      latitude: -27.4718,
      longitude: 153.0231,
      status: 'controlled',
      controller: 'Shadow Clan'
    },
    {
      id: 'dojo-3',
      name: 'The Victory Hotel',
      distance: 1.2,
      latitude: -27.4738,
      longitude: 153.0211,
      status: 'locked'
    },
    {
      id: 'dojo-4',
      name: 'Pool Masters Arena',
      distance: 2.1,
      latitude: -27.4758,
      longitude: 153.0191,
      status: 'available'
    }
  ];

  useEffect(() => {
    setNearbyDojos(mockNearbyDojos);
  }, []);

  useEffect(() => {
    if (isTraveling && currentMovement) {
      const interval = setInterval(() => {
        setTravelProgress((prev) => {
          const newProgress = prev + (100 / (currentMovement.estimatedDuration * 60)) * 0.1;
          if (newProgress >= 100) {
            completeTravel();
            return 100;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isTraveling, currentMovement]);

  const travelOptions: TravelOption[] = [
    {
      method: 'walking',
      duration: 15,
      cost: 0,
      icon: <DirectionsWalk />,
      color: '#4CAF50'
    },
    {
      method: 'driving',
      duration: 5,
      cost: 10,
      icon: <DirectionsCar />,
      color: '#2196F3'
    },
    {
      method: 'public_transport',
      duration: 8,
      cost: 3,
      icon: <DirectionsBus />,
      color: '#FF9800'
    }
  ];

  const calculateTravelTime = (distance: number, method: string): number => {
    const speeds = {
      walking: 5, // km/h
      driving: 30, // km/h
      public_transport: 20 // km/h
    };
    return Math.ceil((distance / speeds[method as keyof typeof speeds]) * 60);
  };

  const handleStartTravel = async (destination: NearbyDojo, method: 'walking' | 'driving' | 'public_transport') => {
    const duration = calculateTravelTime(destination.distance, method);
    
    const movement = {
      playerId: 'current-player',
      fromLocation: currentLocation,
      toLocation: {
        dojoId: destination.id,
        dojoName: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude
      },
      startTime: new Date(),
      estimatedDuration: duration,
      travelMethod: method,
      status: 'traveling'
    };

    setCurrentMovement(movement);
    setIsTraveling(true);
    setTravelProgress(0);
    setShowTravelDialog(false);

    onTravelStarted?.(movement);

    // Simulate travel completion after duration
    setTimeout(() => {
      completeTravel();
    }, duration * 60 * 1000);
  };

  const completeTravel = () => {
    if (currentMovement) {
      const completedMovement = {
        ...currentMovement,
        status: 'arrived',
        endTime: new Date()
      };

      setCurrentMovement(null);
      setIsTraveling(false);
      setTravelProgress(0);

      onTravelCompleted?.(completedMovement);
    }
  };

  const cancelTravel = () => {
    if (currentMovement) {
      const cancelledMovement = {
        ...currentMovement,
        status: 'cancelled',
        endTime: new Date()
      };

      setCurrentMovement(null);
      setIsTraveling(false);
      setTravelProgress(0);

      onTravelCancelled?.(cancelledMovement);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: '#4CAF50',
      controlled: '#FF9800',
      locked: '#F44336'
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      available: <CheckCircle color="success" />,
      controlled: <Warning color="warning" />,
      locked: <Close color="error" />
    };
    return icons[status as keyof typeof icons];
  };

  if (isTraveling && currentMovement) {
    return (
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Navigation color="primary" />
            Traveling to {currentMovement.toLocation.dojoName}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(travelProgress)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={travelProgress} />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {Math.ceil((100 - travelProgress) / 100 * currentMovement.estimatedDuration)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Minutes Left
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="secondary">
                  {currentMovement.travelMethod.replace('_', ' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Travel Method
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<Cancel />}
            onClick={cancelTravel}
          >
            Cancel Travel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 500, width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="primary" />
            Travel
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Current Location: {currentLocation.dojoName || 'Unknown Location'}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Nearby Dojos
        </Typography>

        <List>
          {nearbyDojos.map((dojo) => (
            <ListItem
              key={dojo.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => {
                setSelectedDestination(dojo);
                setShowTravelDialog(true);
              }}
            >
              <ListItemIcon>
                {getStatusIcon(dojo.status)}
              </ListItemIcon>
              <ListItemText
                primary={dojo.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {dojo.distance} km away
                    </Typography>
                    {dojo.controller && (
                      <Chip 
                        label={`Controlled by ${dojo.controller}`} 
                        size="small" 
                        color="warning" 
                      />
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton size="small">
                  <Navigation />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Click on a dojo to start traveling. Different travel methods have different costs and durations.
          </Typography>
        </Alert>
      </CardContent>

      {/* Travel Method Selection Dialog */}
      <Dialog open={showTravelDialog} onClose={() => setShowTravelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Travel to {selectedDestination?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Choose your travel method:
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {travelOptions.map((option) => {
              const duration = calculateTravelTime(selectedDestination?.distance || 0, option.method);
              return (
                <Grid item xs={12} key={option.method}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      border: selectedTravelMethod === option.method ? 2 : 1,
                      borderColor: selectedTravelMethod === option.method ? option.color : 'divider',
                      '&:hover': {
                        borderColor: option.color,
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => setSelectedTravelMethod(option.method)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: option.color }}>
                            {option.icon}
                          </Box>
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                            {option.method.replace('_', ' ')}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" color="primary">
                            {duration} min
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.cost > 0 ? `${option.cost} coins` : 'Free'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Travel time is based on real-world distances. You'll be unable to perform other actions while traveling.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTravelDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedDestination) {
                handleStartTravel(selectedDestination, selectedTravelMethod);
              }
            }}
            startIcon={<Navigation />}
          >
            Start Travel
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PlayerMovementPanel; 