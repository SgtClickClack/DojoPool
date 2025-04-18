import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  TrendingUp,
  TrendingDown,
  RemoveCircle,
  Star,
  Warning,
  CheckCircle,
} from "@mui/icons-material";
import axios from "axios";

const PredictorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const MetricBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
}));

interface PerformancePrediction {
  skill_trend: {
    trend:
      | "improving_rapidly"
      | "improving_steadily"
      | "stable"
      | "declining"
      | "unknown";
    confidence: number;
  };
  potential_peak: {
    current_level: number;
    estimated_peak: number;
    confidence: number;
  };
  areas_for_improvement: Array<{
    aspect: string;
    priority: "high" | "medium" | "low";
    suggestion: string;
  }>;
}

export const PerformancePredictor: React.FC = () => {
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/ai/performance-prediction");
      setPrediction(response.data);
    } catch (err) {
      setError(
        "Failed to fetch performance prediction. Please try again later.",
      );
      console.error("Error fetching prediction:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving_rapidly":
      case "improving_steadily":
        return <TrendingUp color="success" />;
      case "declining":
        return <TrendingDown color="error" />;
      case "stable":
        return <RemoveCircle color="info" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "info";
    }
  };

  if (loading) {
    return (
      <PredictorContainer>
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </Box>
      </PredictorContainer>
    );
  }

  if (error) {
    return (
      <PredictorContainer>
        <Alert severity="error">{error}</Alert>
      </PredictorContainer>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <PredictorContainer>
      <Typography variant="h5" gutterBottom>
        Performance Prediction
      </Typography>

      <MetricBox>
        <Box display="flex" alignItems="center" mb={1}>
          {getTrendIcon(prediction.skill_trend.trend)}
          <Typography variant="h6" ml={1}>
            Skill Trend
          </Typography>
        </Box>
        <Typography>
          Your performance is{" "}
          <strong>{prediction.skill_trend.trend.replace("_", " ")}</strong> with{" "}
          {Math.round(prediction.skill_trend.confidence * 100)}% confidence
        </Typography>
      </MetricBox>

      <MetricBox>
        <Box display="flex" alignItems="center" mb={1}>
          <Star color="primary" />
          <Typography variant="h6" ml={1}>
            Potential Peak
          </Typography>
        </Box>
        <Typography>
          Current Level: {prediction.potential_peak.current_level}
          <br />
          Estimated Peak: {prediction.potential_peak.estimated_peak}
          <br />
          Confidence: {Math.round(prediction.potential_peak.confidence * 100)}%
        </Typography>
      </MetricBox>

      <Typography variant="h6" gutterBottom>
        Areas for Improvement
      </Typography>
      <List>
        {prediction.areas_for_improvement.map((area, index) => (
          <React.Fragment key={area.aspect}>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color={getPriorityColor(area.priority) as any} />
              </ListItemIcon>
              <ListItemText primary={area.aspect} secondary={area.suggestion} />
            </ListItem>
            {index < prediction.areas_for_improvement.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
    </PredictorContainer>
  );
};

export default PerformancePredictor;
