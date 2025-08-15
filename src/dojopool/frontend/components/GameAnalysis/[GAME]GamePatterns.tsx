import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  TrendingUp,
  LocationOn,
  Repeat,
  EmojiEvents,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const PatternCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
}));

interface GamePatternsProps {
  patterns: {
    shot_distribution: {
      [key: string]: number;
    };
    player_positioning: {
      [key: string]: number;
    };
    common_sequences: Array<{
      description: string;
      frequency: number;
      success_rate: number;
    }>;
    success_patterns: {
      [key: string]: string;
    };
  };
}

export const GamePatterns: React.FC<GamePatternsProps> = ({ patterns }) => {
  if (!patterns) {
    return (
      <Typography color="textSecondary">No pattern data available</Typography>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Shot Distribution */}
        <Grid item xs={12} md={6}>
          <PatternCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Shot Distribution</Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  height: 300,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Placeholder for shot distribution heatmap */}
                <Typography color="textSecondary">
                  Shot distribution heatmap
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Analysis of shot type frequencies and spatial distribution
              </Typography>
            </CardContent>
          </PatternCard>
        </Grid>

        {/* Player Positioning */}
        <Grid item xs={12} md={6}>
          <PatternCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LocationOn color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Player Positioning</Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  height: 300,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Placeholder for positioning visualization */}
                <Typography color="textSecondary">
                  Player positioning patterns
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Analysis of player movement and positioning strategies
              </Typography>
            </CardContent>
          </PatternCard>
        </Grid>

        {/* Common Sequences */}
        <Grid item xs={12} md={6}>
          <PatternCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Repeat color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Common Sequences</Typography>
              </Box>
              <List>
                {patterns.common_sequences.map((sequence, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={`Sequence ${index + 1}`}
                        secondary={sequence.description}
                      />
                    </ListItem>
                    {index < patterns.common_sequences.length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </PatternCard>
        </Grid>

        {/* Success Patterns */}
        <Grid item xs={12} md={6}>
          <PatternCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EmojiEvents color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Success Patterns</Typography>
              </Box>
              <List>
                {Object.entries(patterns.success_patterns).map(
                  ([key, value], index) => (
                    <React.Fragment key={key}>
                      <ListItem>
                        <ListItemText
                          primary={key.replace(/_/g, " ").toUpperCase()}
                          secondary={value}
                        />
                      </ListItem>
                      {index <
                        Object.entries(patterns.success_patterns).length -
                          1 && <Divider />}
                    </React.Fragment>
                  ),
                )}
              </List>
            </CardContent>
          </PatternCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GamePatterns;
