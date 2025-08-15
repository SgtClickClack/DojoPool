import React from "react";
import { Paper, Typography, Slider, Box, List, ListItem, ListItemText, Chip } from "@mui/material";

interface Chunk {
  name: string;
  size: number;
  dependencies: string[];
}

interface LargeChunksListProps {
  largeChunks: Chunk[];
  threshold: number;
  onThresholdChange: (event: Event, newValue: number | number[]) => void;
}

const LargeChunksList: React.FC<LargeChunksListProps> = ({ largeChunks, threshold, onThresholdChange }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Large Chunks
    </Typography>
    <Typography gutterBottom>
      Size Threshold: {threshold} KB
    </Typography>
    <Slider
      value={threshold}
      onChange={onThresholdChange}
      min={50}
      max={500}
      step={10}
      valueLabelDisplay="auto"
      aria-label="Size threshold slider"
    />
    <Box sx={{ maxHeight: 400, overflow: "auto" }}>
      <List>
        {largeChunks.map((chunk, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={chunk.name}
              secondary={`Size: ${(chunk.size / 1024).toFixed(2)} KB, Dependencies: ${chunk.dependencies.length}`}
            />
            <Chip
              label={`${(chunk.size / 1024).toFixed(0)} KB`}
              color={chunk.size > threshold * 1024 ? "error" : "warning"}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  </Paper>
);

export default LargeChunksList; 