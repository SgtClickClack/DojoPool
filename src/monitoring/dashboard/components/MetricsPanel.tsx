import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from "@mui/material";
import { MetricsData } from "../../collectors/MetricsCollector";
import { AlertThreshold } from "../../config";

interface MetricsPanelProps {
  title: string;
  metrics?: MetricsData;
  thresholds?: Record<string, AlertThreshold>;
}

const getThresholdColor = (
  value: number,
  threshold?: AlertThreshold,
): string => {
  if (!threshold) return "primary.main";
  if (value >= threshold.critical) return "error.main";
  if (value >= threshold.warning) return "warning.main";
  return "success.main";
};

const formatMetricValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(2);
};

const calculateProgress = (
  value: number,
  threshold?: AlertThreshold,
): number => {
  if (!threshold) return 0;
  const max = threshold.critical * 1.2; // Add 20% buffer
  return Math.min((value / max) * 100, 100);
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  title,
  metrics = {},
  thresholds = {},
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">Warning</TableCell>
              <TableCell align="right">Critical</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(metrics).map(([name, value]) => {
              const threshold = thresholds[name];
              const color = getThresholdColor(value, threshold);
              const progress = calculateProgress(value, threshold);

              return (
                <TableRow key={name}>
                  <TableCell component="th" scope="row">
                    {name}
                  </TableCell>
                  <TableCell align="right">
                    <Typography color={color}>
                      {formatMetricValue(value)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {threshold?.warning
                      ? formatMetricValue(threshold.warning)
                      : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {threshold?.critical
                      ? formatMetricValue(threshold.critical)
                      : "-"}
                  </TableCell>
                  <TableCell sx={{ width: "30%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={
                        value >= (threshold?.critical ?? Infinity)
                          ? "error"
                          : value >= (threshold?.warning ?? Infinity)
                            ? "warning"
                            : "success"
                      }
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
