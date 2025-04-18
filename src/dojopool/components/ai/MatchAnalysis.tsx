import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  RemoveCircleOutline as NeutralIcon,
  Speed as SpeedIcon,
  Gavel as AccuracyIcon,
  Timer as TimeIcon,
  Psychology as StrategyIcon,
} from "@mui/icons-material";

interface Metric {
  name: string;
  value: number;
  trend: "up" | "down" | "neutral";
  change: number;
}

interface KeyMoment {
  timestamp: string;
  description: string;
  impact: number;
  type: string;
}

interface Pattern {
  name: string;
  frequency: number;
  effectiveness: number;
  description: string;
}

interface MatchAnalysisProps {
  metrics: Metric[];
  keyMoments: KeyMoment[];
  patterns: Pattern[];
  summary: string;
}

export const MatchAnalysis: React.FC<MatchAnalysisProps> = ({
  metrics,
  keyMoments,
  patterns,
  summary,
}) => {
  const theme = useTheme();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUpIcon color="success" />;
      case "down":
        return <TrendingDownIcon color="error" />;
      default:
        return <NeutralIcon color="action" />;
    }
  };

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "speed":
        return <SpeedIcon />;
      case "accuracy":
        return <AccuracyIcon />;
      case "time":
        return <TimeIcon />;
      case "strategy":
        return <StrategyIcon />;
      default:
        return <SpeedIcon />;
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact > 0.7) return theme.palette.success.main;
    if (impact > 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Stack spacing={3}>
      {/* Summary Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Match Summary
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {summary}
          </Typography>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <Grid container spacing={2}>
            {metrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getMetricIcon(metric.name)}
                      <Typography variant="subtitle1">{metric.name}</Typography>
                    </Box>
                    <Typography variant="h4">{metric.value}%</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getTrendIcon(metric.trend)}
                      <Typography
                        variant="body2"
                        color={
                          metric.trend === "up" ? "success.main" : "error.main"
                        }
                      >
                        {metric.change > 0 ? "+" : ""}
                        {metric.change}%
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Key Moments */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Key Moments
          </Typography>
          <Stack spacing={2}>
            {keyMoments.map((moment, index) => (
              <Box key={index}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle1">
                      {moment.timestamp}
                    </Typography>
                    <Typography variant="body1">
                      {moment.description}
                    </Typography>
                  </Stack>
                  <Chip
                    label={`Impact: ${Math.round(moment.impact * 100)}%`}
                    sx={{
                      backgroundColor: getImpactColor(moment.impact),
                      color: "white",
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Patterns */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Identified Patterns
          </Typography>
          <Grid container spacing={2}>
            {patterns.map((pattern, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="subtitle1">{pattern.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pattern.description}
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        Frequency: {pattern.frequency}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pattern.frequency}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="body2">
                        Effectiveness: {pattern.effectiveness}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pattern.effectiveness}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: getImpactColor(
                              pattern.effectiveness / 100,
                            ),
                          },
                        }}
                      />
                    </Stack>
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
