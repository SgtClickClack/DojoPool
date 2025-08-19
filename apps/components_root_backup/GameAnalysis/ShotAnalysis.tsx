import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import axios from 'axios';

interface ShotAnalysisProps {
  gameId: number;
}

interface ShotData {
  id: number;
  timestamp: string;
  type: string;
  success: boolean;
  difficulty: number;
  angle: number;
  power: number;
  spin: number;
  notes?: string;
}

export const ShotAnalysis: React.FC<ShotAnalysisProps> = ({ gameId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<ShotData[]>([]);

  useEffect(() => {
    fetchShotData();
  }, [gameId]);

  const fetchShotData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/analysis/game/${gameId}/shots`);
      setShots(response.data.shots);
    } catch (err) {
      setError('Failed to load shot analysis');
      console.error('Shot analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={3}>
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Shot Analysis
      </Typography>

      <Grid container spacing={2}>
        {shots.map((shot) => (
          <Grid item xs={12} sm={6} md={4} key={shot.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Shot #{shot.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {shot.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success: {shot.success ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Difficulty: {shot.difficulty}/10
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Angle: {shot.angle}°
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Power: {shot.power}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Spin: {shot.spin}
                </Typography>
                {shot.notes && (
                  <Typography variant="body2" color="text.secondary">
                    Notes: {shot.notes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
