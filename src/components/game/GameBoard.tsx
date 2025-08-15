import React, { useEffect, useRef } from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";
import Konva from "konva";
import { Ball } from "../../types/game";
import { KonvaEventObject } from "konva";

interface GameBoardProps {
  width: number;
  height: number;
  balls: Ball[];
  onBallClick?: (ballId: number) => void;
  onTableClick?: (x: number, y: number) => void;
  isInteractive?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  width,
  height,
  balls,
  onBallClick,
  onTableClick,
  isInteractive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  // Colors based on theme
  const feltColor = useColorModeValue("#2D5A27", "#1A3D16");
  const railColor = useColorModeValue("#8B4513", "#5C2D0D");
  const pocketColor = useColorModeValue("#000000", "#000000");

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: width,
      height: height,
    });

    // Create layer
    const layer = new Konva.Layer();
    stage.add(layer);

    // Store refs
    stageRef.current = stage;
    layerRef.current = layer;

    // Draw table
    drawTable(layer);

    // Draw balls
    drawBalls(layer, balls);

    // Add event listeners
    if (isInteractive) {
      stage.on("click", handleClick);
    }

    return () => {
      stage.destroy();
    };
  }, [width, height, balls, isInteractive]);

  const drawTable = (layer: Konva.Layer) => {
    // Draw felt
    const felt = new Konva.Rect({
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: feltColor,
      cornerRadius: 10,
    });
    layer.add(felt);

    // Draw rails
    const railWidth = 20;
    const rails = [
      { x: 0, y: 0, width: width, height: railWidth }, // Top
      { x: 0, y: height - railWidth, width: width, height: railWidth }, // Bottom
      { x: 0, y: 0, width: railWidth, height: height }, // Left
      { x: width - railWidth, y: 0, width: railWidth, height: height }, // Right
    ];

    rails.forEach((rail) => {
      const railRect = new Konva.Rect({
        ...rail,
        fill: railColor,
      });
      layer.add(railRect);
    });

    // Draw pockets
    const pocketRadius = 15;
    const pockets = [
      { x: 0, y: 0 }, // Top left
      { x: width / 2, y: 0 }, // Top center
      { x: width, y: 0 }, // Top right
      { x: 0, y: height }, // Bottom left
      { x: width / 2, y: height }, // Bottom center
      { x: width, y: height }, // Bottom right
    ];

    pockets.forEach((pocket) => {
      const pocketCircle = new Konva.Circle({
        x: pocket.x,
        y: pocket.y,
        radius: pocketRadius,
        fill: pocketColor,
      });
      layer.add(pocketCircle);
    });
  };

  const drawBalls = (layer: Konva.Layer, balls: Ball[]) => {
    // Clear existing balls
    layer.find(".ball").forEach((ball) => ball.destroy());

    // Draw new balls
    balls.forEach((ball) => {
      const ballCircle = new Konva.Circle({
        x: ball.x,
        y: ball.y,
        radius: 15,
        fill: ball.color,
        stroke: "#000000",
        strokeWidth: 1,
        className: "ball",
      });

      // Add number if specified
      if (ball.number !== undefined) {
        const numberText = new Konva.Text({
          x: ball.x - 5,
          y: ball.y - 7,
          text: ball.number.toString(),
          fill: "#FFFFFF",
          fontSize: 12,
          fontWeight: "bold",
        });
        layer.add(numberText);
      }

      layer.add(ballCircle);
    });
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    // Check if clicked on a ball
    const ball = layerRef.current?.findOne(`.ball`) as Konva.Circle;
    if (ball) {
      const ballPos = ball.getAbsolutePosition();
      const distance = Math.sqrt(
        Math.pow(pos.x - ballPos.x, 2) + Math.pow(pos.y - ballPos.y, 2),
      );

      if (distance <= 15) {
        const ballId = parseInt(ball.getAttr("id") || "0");
        onBallClick?.(ballId);
        return;
      }
    }

    // If not clicked on a ball, handle table click
    onTableClick?.(pos.x, pos.y);
  };

  return (
    <Box
      ref={containerRef}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={feltColor}
    />
  );
};
