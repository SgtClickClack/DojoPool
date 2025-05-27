import React from "react";
import { Paper, Typography, List, ListItem, ListItemText } from "@mui/material";

interface OptimizationSuggestionsListProps {
  suggestions: string[];
}

const OptimizationSuggestionsList: React.FC<OptimizationSuggestionsListProps> = ({ suggestions }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Optimization Suggestions
    </Typography>
    <List>
      {suggestions.map((suggestion, index) => (
        <ListItem key={index}>
          <ListItemText primary={suggestion} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

export default OptimizationSuggestionsList; 