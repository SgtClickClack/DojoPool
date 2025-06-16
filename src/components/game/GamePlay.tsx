import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { GameBoard } from "./GameBoard";
import { GameControls } from "./GameControls";
import { GameSpectate } from "./GameSpectate";
import { ShotAnalysis } from "./ShotAnalysis";
import { useToast as useToastChakra } from '@chakra-ui/toast';

interface Ball {
  id: number;
  x: number;
  y: number;
  color: string;
  number?: number;
}

interface GameState {
  balls: Ball[];
  currentPlayer: number;
  gameStatus: "waiting" | "in_progress" | "finished";
  winner?: number;
}

interface ShotAnalysisResult {
  successProbability: number;
  difficulty: "easy" | "medium" | "hard";
  recommendedPower: number;
  recommendedAngle: number;
  recommendedSpin: number;
  tips: string[];
  warnings: string[];
}

interface GamePlayProps {
  gameId: string;
  isSpectator?: boolean;
  onGameEnd?: (winner: number) => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  gameId,
  isSpectator = false,
  onGameEnd,
}) => {
  const [gameState, setGameState] = useState<GameState>({
    balls: [],
    currentPlayer: 1,
    gameStatus: "waiting",
  });
  const [selectedBall, setSelectedBall] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [shotPower, setShotPower] = useState(0);
  const [shotAngle, setShotAngle] = useState(0);
  const [shotSpin, setShotSpin] = useState(0);
  const toast = useToastChakra();

  // Colors based on theme
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    // Initialize game state
    initializeGame();

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://localhost:8000/game/${gameId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleGameUpdate(update);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Lost connection to game server",
        status: "error",
        duration: null,
        isClosable: true,
      });
    };

    return () => {
      ws.close();
    };
  }, [gameId]);

  const initializeGame = () => {
    // Initialize balls in starting positions
    const balls: Ball[] = [
      { id: 0, x: 400, y: 300, color: "#FFFFFF", number: 0 }, // Cue ball
      { id: 1, x: 600, y: 300, color: "#FFFF00", number: 1 }, // Yellow
      { id: 2, x: 620, y: 300, color: "#0000FF", number: 2 }, // Blue
      { id: 3, x: 640, y: 300, color: "#FF0000", number: 3 }, // Red
      // Add more balls in a triangle formation
    ];

    setGameState((prev) => ({
      ...prev,
      balls,
      gameStatus: "in_progress",
    }));
  };

  const handleGameUpdate = (update: any) => {
    setGameState((prev) => ({
      ...prev,
      ...update,
    }));

    if (update.gameStatus === "finished" && update.winner) {
      handleGameEnd(update.winner);
    }
  };

  const handleBallClick = (ballId: number) => {
    if (isSpectator) return;

    setSelectedBall(ballId);
    setIsActive(true);
  };

  const handleTableClick = (x: number, y: number) => {
    if (!selectedBall || isSpectator) return;

    // Calculate shot angle and power based on click position
    const ball = gameState.balls.find((b) => b.id === selectedBall);
    if (!ball) return;

    const dx = x - ball.x;
    const dy = y - ball.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, 100);

    // Send shot to server
    sendShot(power, angle, 0);
  };

  const handleShot = (power: number, angle: number, spin: number) => {
    if (isSpectator) return;
    setShotPower(power);
    setShotAngle(angle);
    setShotSpin(spin);
    sendShot(power, angle, spin);
  };

  const sendShot = (power: number, angle: number, spin: number) => {
    // Send shot data to server
    fetch(`/api/game/${gameId}/shot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        power,
        angle,
        spin,
        ballId: selectedBall,
      }),
    }).catch((error) => {
      console.error("Error sending shot:", error);
      toast({
        title: "Error",
        description: "Failed to send shot",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    });

    setSelectedBall(null);
    setIsActive(false);
  };

  const handleAnalysisComplete = (analysis: ShotAnalysisResult) => {
    // Log analysis results for future improvements
    console.log("Shot Analysis:", analysis);
  };

  const handleGameEnd = (winner: number) => {
    toast({
      title: "Game Over",
      description: `Player ${winner} wins!`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    onGameEnd?.(winner);
  };

  if (isSpectator) {
    return <GameSpectate gameId={gameId} />;
  }

  return (
    <VStack spacing={6} align="stretch" width="100%" maxW="1200px" mx="auto">
      <Box
        p={4}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
      >
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Game Status: {gameState.gameStatus}
        </Text>
        <Text>Current Player: {gameState.currentPlayer}</Text>
      </Box>

      <HStack spacing={6} align="flex-start">
        <Box flex={1}>
          <GameBoard
            width={800}
            height={400}
            balls={gameState.balls}
            onBallClick={handleBallClick}
            onTableClick={handleTableClick}
            isInteractive={!isSpectator}
          />
        </Box>

        <VStack spacing={4} width="400px">
          <GameControls
            onShot={handleShot}
            isActive={isActive}
            onCancel={() => {
              setSelectedBall(null);
              setIsActive(false);
            }}
          />

          {selectedBall !== null && (
            <ShotAnalysis
              currentBall={0} // Cue ball
              targetBall={selectedBall}
              shotPower={shotPower}
              shotAngle={shotAngle}
              shotSpin={shotSpin}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}
        </VStack>
      </HStack>
    </VStack>
  );
};
