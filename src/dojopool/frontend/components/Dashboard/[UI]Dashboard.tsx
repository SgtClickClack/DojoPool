import React from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  EmojiEvents,
  LocationOn,
  People,
  Timeline,
} from "@mui/icons-material";

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: "Active Tournaments",
      value: "5",
      icon: <EmojiEvents />,
      color: "#4caf50",
    },
    {
      title: "Available Venues",
      value: "12",
      icon: <LocationOn />,
      color: "#2196f3",
    },
    {
      title: "Active Players",
      value: "124",
      icon: <People />,
      color: "#ff9800",
    },
    { title: "Games Today", value: "28", icon: <Timeline />, color: "#9c27b0" },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <IconButton>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper elevation={2} sx={{ height: "100%" }}>
              <Card>
                <CardContent sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ mr: 2, color: stat.color }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant="h5" component="div">
                      {stat.value}
                    </Typography>
                    <Typography color="textSecondary">{stat.title}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        ))}

        {/* Recent Tournaments */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2}>
            <Card>
              <CardHeader
                title="Recent Tournaments"
                action={
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  No recent tournaments
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        {/* Active Venues */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2}>
            <Card>
              <CardHeader
                title="Active Venues"
                action={
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  No active venues
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
