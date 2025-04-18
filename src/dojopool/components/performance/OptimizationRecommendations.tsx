import React from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

interface Recommendation {
  id: string;
  type: "cpu" | "memory" | "disk" | "network";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  status: "pending" | "in_progress" | "completed";
}

interface OptimizationRecommendationsProps {
  recommendations: Recommendation[];
}

export const OptimizationRecommendations: React.FC<
  OptimizationRecommendationsProps
> = ({ recommendations }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "cpu":
        return <SpeedIcon />;
      case "memory":
        return <MemoryIcon />;
      case "disk":
        return <StorageIcon />;
      case "network":
        return <NetworkIcon />;
      default:
        return <WarningIcon />;
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
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "pending":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon color="success" />;
      case "in_progress":
        return <WarningIcon color="warning" />;
      case "pending":
        return <WarningIcon color="action" />;
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Optimization Recommendations
      </Typography>
      <List>
        {recommendations.map((recommendation, index) => (
          <React.Fragment key={recommendation.id}>
            {index > 0 && <Divider />}
            <ListItem
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                py: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <ListItemIcon>{getIcon(recommendation.type)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography variant="subtitle1">
                        {recommendation.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={recommendation.priority.toUpperCase()}
                        color={getPriorityColor(recommendation.priority) as any}
                      />
                      <Chip
                        size="small"
                        label={recommendation.status
                          .replace("_", " ")
                          .toUpperCase()}
                        color={getStatusColor(recommendation.status) as any}
                        icon={getStatusIcon(recommendation.status)}
                      />
                    </Box>
                  }
                />
              </Box>
              <Box sx={{ pl: 7 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {recommendation.description}
                </Typography>
                <Typography variant="body2" color="primary">
                  Expected Impact: {recommendation.impact}
                </Typography>
              </Box>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};
