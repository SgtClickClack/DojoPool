import React, { useState, useEffect } from "react";
import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MLService } from "../../services/ml.service";
import { ModelMetrics } from "./ModelMetrics";
import { ShotPrediction } from "./ShotPrediction";
import { PatternRecognition } from "./PatternRecognition";
import { AnomalyDetection } from "./AnomalyDetection";
import { TrainingPlan } from "./TrainingPlan";
import { ErrorBoundary } from "../common/ErrorBoundary";

const mlService = new MLService();

export const MLDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await mlService.getModels();
      setModels(response.data);
      if (response.data.length > 0) {
        setSelectedModel(response.data[0].id);
        await fetchModelMetrics(response.data[0].id);
      }
    } catch (err) {
      setError("Failed to fetch models");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelMetrics = async (modelId: string) => {
    try {
      const response = await mlService.getModelMetrics(modelId);
      setMetrics(response.data);
    } catch (err) {
      setError("Failed to fetch model metrics");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Machine Learning Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Model Metrics */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary>
            <ModelMetrics
              modelId={selectedModel}
              metrics={metrics}
              onModelSelect={async (modelId) => {
                setSelectedModel(modelId);
                await fetchModelMetrics(modelId);
              }}
              models={models}
            />
          </ErrorBoundary>
        </Grid>

        {/* Shot Prediction */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary>
            <ShotPrediction
              modelId={selectedModel}
              onPrediction={(prediction) => {
                console.log("Shot prediction:", prediction);
              }}
            />
          </ErrorBoundary>
        </Grid>

        {/* Pattern Recognition */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary>
            <PatternRecognition
              modelId={selectedModel}
              onPatternDetected={(pattern) => {
                console.log("Pattern detected:", pattern);
              }}
            />
          </ErrorBoundary>
        </Grid>

        {/* Anomaly Detection */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary>
            <AnomalyDetection
              onAnomalyDetected={(anomalies) => {
                console.log("Anomalies detected:", anomalies);
              }}
            />
          </ErrorBoundary>
        </Grid>

        {/* Training Plan */}
        <Grid item xs={12}>
          <ErrorBoundary>
            <TrainingPlan
              metrics={metrics}
              onPlanGenerated={(plan) => {
                console.log("Training plan generated:", plan);
              }}
            />
          </ErrorBoundary>
        </Grid>
      </Grid>
    </Box>
  );
};
