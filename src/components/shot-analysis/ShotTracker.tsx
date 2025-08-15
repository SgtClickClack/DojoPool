import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import {
  ShotAnalysisService,
  ShotData,
} from "../../ai/shot-analysis/ShotAnalysisService";

interface ShotTrackerProps {
  onShotComplete?: (shot: ShotData) => void;
}

export const ShotTracker: React.FC<ShotTrackerProps> = ({ onShotComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const serviceRef = useRef<ShotAnalysisService>(new ShotAnalysisService());

  useEffect(() => {
    const service = serviceRef.current;

    service.on("trackingStarted", () => {
      setIsTracking(true);
    });

    service.on("positionsUpdated", (positions) => {
      updateCanvas(positions);
    });

    service.on("shotCompleted", (shot) => {
      setIsTracking(false);
      onShotComplete?.(shot);
    });

    return () => {
      service.removeAllListeners();
    };
  }, [onShotComplete]);

  const updateCanvas = (positions: {
    cueBall: { x: number; y: number };
    targetBall: { x: number; y: number };
  }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cue ball
    ctx.beginPath();
    ctx.arc(positions.cueBall.x, positions.cueBall.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();

    // Draw target ball
    ctx.beginPath();
    ctx.arc(positions.targetBall.x, positions.targetBall.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
  };

  const handleStartTracking = () => {
    serviceRef.current.startTracking();
  };

  const handleCompleteShot = (success: boolean) => {
    serviceRef.current.completeShot(success, 0.95);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Shot Tracker
      </Typography>
      <Box sx={{ position: "relative", mb: 2 }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={300}
          style={{
            border: "1px solid #ccc",
            borderRadius: 4,
            backgroundColor: "#2c3e50",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <button onClick={handleStartTracking} disabled={isTracking}>
          Start Tracking
        </button>
        <button onClick={() => handleCompleteShot(true)} disabled={!isTracking}>
          Shot Success
        </button>
        <button
          onClick={() => handleCompleteShot(false)}
          disabled={!isTracking}
        >
          Shot Failed
        </button>
      </Box>
    </Paper>
  );
};
