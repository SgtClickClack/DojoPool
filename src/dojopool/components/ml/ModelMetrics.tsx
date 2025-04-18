import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Box,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ModelMetricsProps {
  modelId: string | null;
  metrics: any;
  models: any[];
  onModelSelect: (modelId: string) => void;
}

export const ModelMetrics: React.FC<ModelMetricsProps> = ({
  modelId,
  metrics,
  models,
  onModelSelect,
}) => {
  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Typography>No metrics available</Typography>
        </CardContent>
      </Card>
    );
  }

  const formatMetricValue = (value: number) => {
    return typeof value === "number" ? value.toFixed(3) : value;
  };

  return (
    <Card>
      <CardContent>
        <Box mb={3}>
          <FormControl fullWidth>
            <InputLabel>Select Model</InputLabel>
            <Select
              value={modelId || ""}
              onChange={(e) => onModelSelect(e.target.value as string)}
              label="Select Model"
            >
              {models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.type} -{" "}
                  {new Date(model.trained_at).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="h6" gutterBottom>
          Model Performance Metrics
        </Typography>

        <Grid container spacing={2}>
          {metrics.metrics && (
            <>
              {Object.entries(metrics.metrics).map(
                ([key, value]: [string, any]) => (
                  <Grid item xs={6} key={key}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(value)}
                    </Typography>
                  </Grid>
                ),
              )}
            </>
          )}
        </Grid>

        {metrics.feature_importance && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Feature Importance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={metrics.feature_importance.features.map(
                  (feature: string, index: number) => ({
                    feature,
                    importance: metrics.feature_importance.importance[index],
                  }),
                )}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="feature"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="importance"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            Model Type: {metrics.type}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Trained At: {new Date(metrics.trained_at).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
