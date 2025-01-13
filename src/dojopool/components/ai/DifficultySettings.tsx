import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Timer as TimeIcon,
  Psychology as ComplexityIcon,
  Refresh as ResetIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface DifficultyParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
  recommendation: number;
}

interface DifficultySettingsProps {
  parameters: DifficultyParameter[];
  onParameterChange: (name: string, value: number) => void;
  onReset: () => void;
  adaptiveScore: number;
}

export const DifficultySettings: React.FC<DifficultySettingsProps> = ({
  parameters,
  onParameterChange,
  onReset,
  adaptiveScore,
}) => {
  const theme = useTheme();

  const getParameterIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'speed':
        return <SpeedIcon />;
      case 'time':
        return <TimeIcon />;
      case 'complexity':
        return <ComplexityIcon />;
      default:
        return <SpeedIcon />;
    }
  };

  const getAdaptiveScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const formatValue = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <Stack spacing={3}>
      {/* Adaptive Score Card */}
      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Adaptive Difficulty Score</Typography>
            <Tooltip title="Reset all parameters to recommended values">
              <IconButton onClick={onReset} size="small">
                <ResetIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ position: 'relative', pt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={adaptiveScore}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getAdaptiveScoreColor(adaptiveScore),
                },
              }}
            />
            <Typography
              variant="h4"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, 50%)',
                color: getAdaptiveScoreColor(adaptiveScore),
              }}
            >
              {adaptiveScore}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Parameters Grid */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Difficulty Parameters
          </Typography>
          <Grid container spacing={3}>
            {parameters.map((param, index) => (
              <Grid item xs={12} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Stack spacing={2}>
                    {/* Parameter Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getParameterIcon(param.name)}
                        <Typography variant="subtitle1">{param.name}</Typography>
                      </Box>
                      <Tooltip title={param.description}>
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Slider and Values */}
                    <Box sx={{ px: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Current: {formatValue(param.value)}
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                          Recommended: {formatValue(param.recommendation)}
                        </Typography>
                      </Box>
                      <Slider
                        value={param.value}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        onChange={(_, value) => onParameterChange(param.name, value as number)}
                        valueLabelDisplay="auto"
                        valueLabelFormat={formatValue}
                        marks={[
                          { value: param.min, label: formatValue(param.min) },
                          { value: param.recommendation, label: '↓' },
                          { value: param.max, label: formatValue(param.max) },
                        ]}
                      />
                    </Box>

                    {/* Recommendation Indicator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {Math.abs(param.value - param.recommendation) <= 0.1
                          ? 'Optimal setting'
                          : param.value > param.recommendation
                            ? 'Consider decreasing for better learning'
                            : 'Consider increasing for better challenge'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
};
