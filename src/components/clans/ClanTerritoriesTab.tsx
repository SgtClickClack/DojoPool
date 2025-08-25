import { getClanControlledDojos } from '@/services/APIService';
import { EmojiEvents, LocationOn, People } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface ControlledDojo {
  id: string;
  name: string;
  description?: string;
  coordinates: { lat: number; lng: number };
  status: string;
  influence: number;
  playerCount: number;
  lastCaptured?: string;
}

interface ClanTerritoriesTabProps {
  clanId: string;
}

const ClanTerritoriesTab: React.FC<ClanTerritoriesTabProps> = ({ clanId }) => {
  const [controlledDojos, setControlledDojos] = useState<ControlledDojo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadControlledDojos();
  }, [clanId]);

  const loadControlledDojos = async () => {
    try {
      setLoading(true);
      const dojos = await getClanControlledDojos(clanId);
      setControlledDojos(dojos);
      setError(null);
    } catch (err) {
      setError('Failed to load controlled territories');
      console.error('Error loading controlled dojos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (controlledDojos.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Territories Controlled
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This clan hasn't captured any dojos yet. Start playing matches to
          claim territories!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" gutterBottom>
          Controlled Territories ({controlledDojos.length})
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {controlledDojos.map((dojo) => (
          <Grid item xs={12} sm={6} md={4} key={dojo.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40,
                      mr: 2,
                    }}
                  >
                    🏠
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {dojo.name}
                    </Typography>
                    <Chip
                      label={dojo.status}
                      size="small"
                      color={dojo.status === 'active' ? 'success' : 'warning'}
                    />
                  </Box>
                </Box>

                {dojo.description && (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {dojo.description}
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <EmojiEvents
                      sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }}
                    />
                    <Typography variant="body2">
                      {dojo.influence}% influence
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <People
                      sx={{ fontSize: 16, mr: 0.5, color: 'info.main' }}
                    />
                    <Typography variant="body2">
                      {dojo.playerCount} players
                    </Typography>
                  </Box>
                </Box>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="caption" color="text.secondary">
                    Coordinates: {dojo.coordinates.lat.toFixed(4)},{' '}
                    {dojo.coordinates.lng.toFixed(4)}
                  </Typography>
                  {dojo.lastCaptured && (
                    <Typography variant="caption" color="text.secondary">
                      Captured:{' '}
                      {new Date(dojo.lastCaptured).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ClanTerritoriesTab;
