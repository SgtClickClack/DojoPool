import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Speed, GpsFixed, RotateRight, Timeline } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const MetricIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

interface ShotAnalysisProps {
  gameId: number;
}

export const ShotAnalysis: React.FC<ShotAnalysisProps> = ({ gameId }) => {
  const [selectedShot, setSelectedShot] = useState(null);

  const renderMetricCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    description: string
  ) => (
    <MetricCard>
      <CardContent>
        <MetricIcon>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </MetricIcon>
        <LinearProgress variant="determinate" value={value * 100} sx={{ mb: 1 }} />
        <Typography variant="h4" gutterBottom>
          {(value * 100).toFixed(1)}%
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>
      </CardContent>
    </MetricCard>
  );

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          {renderMetricCard(
            'Power',
            0.85,
            <Speed color="primary" />,
            'Shot power and velocity analysis'
          )}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          {renderMetricCard(
            'Accuracy',
            0.92,
            <GpsFixed color="primary" />,
            'Shot precision and target alignment'
          )}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          {renderMetricCard(
            'Spin',
            0.78,
            <RotateRight color="primary" />,
            'Ball spin and rotation analysis'
          )}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          {renderMetricCard(
            'Trajectory',
            0.88,
            <Timeline color="primary" />,
            'Path and movement analysis'
          )}
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shot Trajectory Visualization
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 400,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Placeholder for shot trajectory visualization */}
                <Typography color="textSecondary">
                  Shot trajectory visualization will be rendered here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Shot Type
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Break shot with medium-high power and excellent accuracy. The ball trajectory
                    shows optimal path with minimal deviation.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Recommendations
                  </Typography>
                  <Typography variant="body1">
                    - Maintain current power level for consistent results - Consider slight
                    adjustment in spin for better control - Practice similar shots from different
                    angles
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShotAnalysis;
