import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { MLService } from "../../services/ml.service";

interface ShotPredictionProps {
  modelId: string | null;
  onPrediction: (prediction: any) => void;
}

const mlService = new MLService();

const shotTypes = ["straight", "spin", "curve", "lob", "slice"];

export const ShotPrediction: React.FC<ShotPredictionProps> = ({
  modelId,
  onPrediction,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);

  const [shotData, setShotData] = useState({
    type: "straight",
    position: { x: 0, y: 0 },
    speed: 50,
    spin: 50,
  });

  const handleInputChange = (field: string, value: any) => {
    setShotData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePositionChange = (axis: "x" | "y", value: number) => {
    setShotData((prev) => ({
      ...prev,
      position: {
        ...prev.position,
        [axis]: value,
      },
    }));
  };

  const handlePredict = async () => {
    if (!modelId) {
      setError("No model selected");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const transformedData = mlService.transformShotData(shotData);
      const response = await mlService.predictShotSuccess(
        modelId,
        transformedData,
      );

      setPrediction(response.data);
      onPrediction(response.data);
    } catch (err) {
      setError("Failed to predict shot success");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Shot Success Prediction
        </Typography>

        <Grid container spacing={3}>
          {/* Shot Type */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Shot Type</InputLabel>
              <Select
                value={shotData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                label="Shot Type"
              >
                {shotTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Position X */}
          <Grid item xs={12}>
            <Typography gutterBottom>
              Position X: {shotData.position.x}
            </Typography>
            <Slider
              value={shotData.position.x}
              onChange={(_, value) =>
                handlePositionChange("x", value as number)
              }
              min={-100}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>

          {/* Position Y */}
          <Grid item xs={12}>
            <Typography gutterBottom>
              Position Y: {shotData.position.y}
            </Typography>
            <Slider
              value={shotData.position.y}
              onChange={(_, value) =>
                handlePositionChange("y", value as number)
              }
              min={-100}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>

          {/* Speed */}
          <Grid item xs={12}>
            <Typography gutterBottom>Speed: {shotData.speed}</Typography>
            <Slider
              value={shotData.speed}
              onChange={(_, value) => handleInputChange("speed", value)}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>

          {/* Spin */}
          <Grid item xs={12}>
            <Typography gutterBottom>Spin: {shotData.spin}</Typography>
            <Slider
              value={shotData.spin}
              onChange={(_, value) => handleInputChange("spin", value)}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>

          {/* Predict Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePredict}
              disabled={loading || !modelId}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : "Predict"}
            </Button>
          </Grid>

          {/* Error Message */}
          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}

          {/* Prediction Results */}
          {prediction && (
            <Grid item xs={12}>
              <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
                <Typography variant="h6" gutterBottom>
                  Prediction Results
                </Typography>
                <Typography>
                  Success Probability:{" "}
                  {(prediction.success_probability * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Features Used: {prediction.features_used.join(", ")}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};
