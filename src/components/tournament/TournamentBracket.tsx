import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Tooltip,
  Badge,
  Icon,
  Button,
  useToast,
} from "@chakra-ui/react";
import { FaTrophy, FaUser, FaClock, FaCheck } from "react-icons/fa";

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player;
  player2: Player;
  winner?: Player;
  status: "scheduled" | "in_progress" | "completed";
  startTime?: string;
  endTime?: string;
}

interface Player {
  id: string;
  name: string;
  avatar?: string;
  seed?: number;
}

interface TournamentBracketProps {
  tournamentId: string;
  matches: Match[];
  onMatchClick?: (matchId: string) => void;
  isAdmin?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentId,
  matches,
  onMatchClick,
  isAdmin = false,
}) => {
  const [expandedRound, setExpandedRound] = useState<number>(1);
  const toast = useToast();

  // Colors based on theme
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const winnerColor = useColorModeValue("green.500", "green.300");
  const activeColor = useColorModeValue("blue.500", "blue.300");
  const scheduledColor = useColorModeValue("gray.500", "gray.300");

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<number, Match[]>,
  );

  const handleMatchClick = (matchId: string) => {
    if (onMatchClick) {
      onMatchClick(matchId);
    }
  };

  const getMatchStatusColor = (status: Match["status"]) => {
    switch (status) {
      case "completed":
        return winnerColor;
      case "in_progress":
        return activeColor;
      default:
        return scheduledColor;
    }
  };

  const getMatchStatusIcon = (status: Match["status"]) => {
    switch (status) {
      case "completed":
        return FaCheck;
      case "in_progress":
        return FaClock;
      default:
        return FaClock;
    }
  };

  const renderMatch = (match: Match) => {
    const StatusIcon = getMatchStatusIcon(match.status);
    const statusColor = getMatchStatusColor(match.status);

    return (
      <Box
        key={match.id}
        p={4}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        cursor={onMatchClick ? "pointer" : "default"}
        onClick={() => handleMatchClick(match.id)}
        _hover={
          onMatchClick
            ? { transform: "scale(1.02)", transition: "transform 0.2s" }
            : undefined
        }
      >
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontWeight="bold">Match {match.matchNumber}</Text>
            <Badge
              colorScheme={
                match.status === "completed"
                  ? "green"
                  : match.status === "in_progress"
                    ? "blue"
                    : "gray"
              }
            >
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </Badge>
          </HStack>

          <HStack spacing={2}>
            <Icon as={FaUser} />
            <Text>{match.player1.name}</Text>
            {match.player1.seed && (
              <Badge colorScheme="purple">Seed {match.player1.seed}</Badge>
            )}
          </HStack>

          <HStack spacing={2}>
            <Icon as={FaUser} />
            <Text>{match.player2.name}</Text>
            {match.player2.seed && (
              <Badge colorScheme="purple">Seed {match.player2.seed}</Badge>
            )}
          </HStack>

          {match.winner && (
            <HStack spacing={2} color={winnerColor}>
              <Icon as={FaTrophy} />
              <Text fontWeight="bold">Winner: {match.winner.name}</Text>
            </HStack>
          )}

          {match.startTime && (
            <HStack spacing={2}>
              <Icon as={FaClock} />
              <Text fontSize="sm">
                Started: {new Date(match.startTime).toLocaleString()}
              </Text>
            </HStack>
          )}

          {match.endTime && (
            <HStack spacing={2}>
              <Icon as={FaCheck} />
              <Text fontSize="sm">
                Completed: {new Date(match.endTime).toLocaleString()}
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>
    );
  };

  const renderRound = (round: number, roundMatches: Match[]) => {
    const isExpanded = round <= expandedRound;

    return (
      <Box key={round} width="100%">
        <HStack justify="space-between" mb={4}>
          <Text fontSize="xl" fontWeight="bold">
            Round {round}
          </Text>
          {round > 1 && (
            <Button
              size="sm"
              onClick={() =>
                setExpandedRound((prev) => (prev === round ? round - 1 : round))
              }
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          )}
        </HStack>

        {isExpanded && (
          <VStack spacing={4} align="stretch">
            {roundMatches.map(renderMatch)}
          </VStack>
        )}
      </Box>
    );
  };

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
          Tournament Bracket
        </Text>
        <VStack spacing={6} align="stretch">
          {Object.entries(matchesByRound)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, matches]) => renderRound(Number(round), matches))}
        </VStack>
      </Box>
    </VStack>
  );
};
