import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  VStack,
  HStack,
  Text,
  Avatar,
  Progress,
  Badge,
  IconButton,
  useToast,
  Divider,
} from "@chakra-ui/react";
import { BsChat } from "react-icons/bs";
import { AiFillStar } from "react-icons/ai";
import { IoShare } from "react-icons/io5";
import axios from "axios";

interface Player {
  username: string;
  avatar?: string;
  rating: number;
  wins: number;
  losses: number;
}

interface GameState {
  id: number;
  status: "in_progress" | "completed" | "cancelled";
  player1: Player;
  player2: Player;
  current_player: string;
  player1_score: number;
  player2_score: number;
  total_shots: number;
  duration: string;
  difficulty_rating: number;
  spectator_count: number;
  stats: {
    accuracy: number;
    position_play: number;
    shot_difficulty: number;
  };
}

export const GameSpectate: React.FC<{ gameId: number }> = ({ gameId }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Initial game state
    fetchGameState();

    // Set up WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws/game/${gameId}/`);

    ws.onopen = () => {
      console.log("Connected to game WebSocket");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleGameUpdate(data);
    };

    ws.onclose = () => {
      console.log("Disconnected from game WebSocket");
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        setSocket(
          new WebSocket(`ws://${window.location.host}/ws/game/${gameId}/`),
        );
      }, 3000);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [gameId]);

  const fetchGameState = async () => {
    try {
      const response = await axios.get(`/api/games/${gameId}/`);
      setGameState(response.data);
    } catch (error) {
      toast({
        title: "Error fetching game state",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameUpdate = (data: any) => {
    switch (data.type) {
      case "game_state":
        setGameState(data.state);
        break;
      case "shot_made":
        toast({
          title: "Great Shot! 🎯",
          description: data.description,
          status: "success",
          duration: 2000,
        });
        break;
      case "game_completed":
        toast({
          title: "Game Complete!",
          description: `${data.winner} wins!`,
          status: "info",
          duration: 5000,
        });
        break;
    }
  };

  if (isLoading || !gameState) {
    return <Box>Loading...</Box>;
  }

  const PlayerStats: React.FC<{
    player: Player;
    score: number;
    isCurrent: boolean;
  }> = ({ player, score, isCurrent }) => (
    <VStack
      p={4}
      bg="gray.800"
      borderRadius="lg"
      borderWidth={2}
      borderColor={isCurrent ? "purple.500" : "transparent"}
      gap={3}
      align="stretch"
    >
      <HStack gap={4}>
        <Avatar size="lg" name={player.username} src={player.avatar} />
        <Box>
          <Text fontSize="xl" fontWeight="bold">
            {player.username}
          </Text>
          <HStack gap={2}>
            <Badge colorScheme="purple">Rating: {player.rating}</Badge>
            <Badge colorScheme="green">W: {player.wins}</Badge>
            <Badge colorScheme="red">L: {player.losses}</Badge>
          </HStack>
        </Box>
      </HStack>

      <Box>
        <Text mb={1}>Score</Text>
        <Text fontSize="3xl" fontWeight="bold">
          {score}
        </Text>
      </Box>

      {isCurrent && (
        <Badge colorScheme="purple" p={2} textAlign="center">
          Current Turn
        </Badge>
      )}
    </VStack>
  );

  return (
    <Box>
      <Grid templateColumns="1fr auto 1fr" gap={6} mb={6}>
        <PlayerStats
          player={gameState.player1}
          score={gameState.player1_score}
          isCurrent={gameState.current_player === gameState.player1.username}
        />

        <VStack justify="center" gap={4}>
          <Badge
            colorScheme={gameState.status === "in_progress" ? "green" : "gray"}
            p={2}
            fontSize="lg"
          >
            {gameState.status.toUpperCase()}
          </Badge>
          <Text fontSize="sm" color="gray.400">
            Duration: {gameState.duration}
          </Text>
          <Text fontSize="sm" color="gray.400">
            👥 {gameState.spectator_count} watching
          </Text>

          {/* Social Icons */}
          <HStack gap={4} justify="center" mt={4}>
            <IconButton
              aria-label="Chat with players"
              icon={<BsChat /> as any}
              size="md"
              variant="ghost"
            />
            <IconButton
              aria-label="Highlight game"
              icon={<AiFillStar /> as any}
              size="md"
              variant="ghost"
            />
            <IconButton
              aria-label="Share game"
              icon={<IoShare /> as any}
              size="md"
              variant="ghost"
            />
          </HStack>
        </VStack>

        <PlayerStats
          player={gameState.player2}
          score={gameState.player2_score}
          isCurrent={gameState.current_player === gameState.player2.username}
        />
      </Grid>

      <Box bg="gray.800" p={4} borderRadius="lg" mb={6}>
        <Text fontSize="lg" mb={4}>
          Game Stats
        </Text>
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <VStack>
            <Text color="gray.400">Accuracy</Text>
            <Progress
              value={gameState.stats.accuracy}
              colorScheme="green"
              width="100%"
            />
            <Text>{gameState.stats.accuracy}%</Text>
          </VStack>

          <VStack>
            <Text color="gray.400">Position Play</Text>
            <Progress
              value={gameState.stats.position_play}
              colorScheme="blue"
              width="100%"
            />
            <Text>{gameState.stats.position_play}%</Text>
          </VStack>

          <VStack>
            <Text color="gray.400">Shot Difficulty</Text>
            <Progress
              value={gameState.stats.shot_difficulty * 10}
              colorScheme="purple"
              width="100%"
            />
            <Text>{gameState.stats.shot_difficulty.toFixed(1)}/10</Text>
          </VStack>
        </Grid>
      </Box>
    </Box>
  );
};
