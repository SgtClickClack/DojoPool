import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Button,
  Badge,
  Avatar,
  Progress,
  useColorModeValue,
  VStack,
  HStack,
  Divider,
  Icon,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrophy,
  FaUsers,
  FaCoins,
  FaClock,
  FaPlay,
  FaPause,
  FaEye,
} from "react-icons/fa";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  seed: number;
  wins: number;
  losses: number;
}

interface Match {
  id: string;
  round: number;
  match_number: number;
  participant1?: Participant;
  participant2?: Participant;
  winner?: Participant;
  score?: string;
  status: "pending" | "in_progress" | "completed" | "bye";
  start_time?: string;
  spectator_count: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  type: string;
  current_round: number;
  total_rounds: number;
  prize_pool: number;
  participant_count: number;
  max_participants: number;
  start_date: string;
  matches: Match[];
}

const TournamentView: React.FC<{ tournamentId: string }> = ({
  tournamentId,
}) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const highlightColor = useColorModeValue("blue.50", "blue.900");

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(
      `${process.env.REACT_APP_WS_URL}/tournaments/${tournamentId}/`,
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "tournament_update") {
        setTournament(data.tournament);
      } else if (data.type === "match_update") {
        updateMatch(data.match);
      }
    };

    // Fetch initial tournament data
    fetchTournamentData();

    return () => ws.close();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      const data = await response.json();
      setTournament(data);
    } catch (error) {
      console.error("Error fetching tournament data:", error);
      toast({
        title: "Error loading tournament",
        status: "error",
        duration: 5000,
      });
    }
  };

  const updateMatch = (updatedMatch: Match) => {
    if (!tournament) return;

    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: prev.matches.map((match) =>
          match.id === updatedMatch.id ? updatedMatch : match,
        ),
      };
    });

    if (selectedMatch?.id === updatedMatch.id) {
      setSelectedMatch(updatedMatch);
    }
  };

  const renderTournamentHeader = () => {
    if (!tournament) return null;

    return (
      <Box p={6} bg={bgColor} borderRadius="lg" shadow="base" mb={6}>
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="lg">{tournament.name}</Heading>
            <HStack spacing={4}>
              <Badge colorScheme="blue">{tournament.type}</Badge>
              <Badge
                colorScheme={
                  tournament.status === "in_progress"
                    ? "green"
                    : tournament.status === "completed"
                      ? "gray"
                      : "orange"
                }
              >
                {tournament.status}
              </Badge>
            </HStack>
          </VStack>

          <HStack spacing={6}>
            <VStack align="center">
              <Icon as={FaUsers} color="blue.500" boxSize={6} />
              <Text fontSize="sm">
                {tournament.participant_count}/{tournament.max_participants}
              </Text>
            </VStack>

            <VStack align="center">
              <Icon as={FaCoins} color="yellow.500" boxSize={6} />
              <Text fontSize="sm">{tournament.prize_pool} DC</Text>
            </VStack>

            <VStack align="center">
              <Icon as={FaClock} color="green.500" boxSize={6} />
              <Text fontSize="sm">
                Round {tournament.current_round}/{tournament.total_rounds}
              </Text>
            </VStack>
          </HStack>
        </Flex>

        <Progress
          mt={4}
          value={(tournament.current_round / tournament.total_rounds) * 100}
          colorScheme="blue"
          borderRadius="full"
        />
      </Box>
    );
  };

  const renderBracket = () => {
    if (!tournament) return null;

    const rounds = Array.from({ length: tournament.total_rounds }, (_, i) =>
      tournament.matches.filter((m) => m.round === i + 1),
    );

    return (
      <Grid
        templateColumns={`repeat(${tournament.total_rounds}, 1fr)`}
        gap={4}
        overflowX="auto"
        p={4}
      >
        {rounds.map((roundMatches, roundIndex) => (
          <VStack key={roundIndex} spacing={4}>
            <Text fontWeight="bold" mb={2}>
              Round {roundIndex + 1}
            </Text>

            {roundMatches.map((match) => (
              <Box
                key={match.id}
                p={4}
                bg={match.id === selectedMatch?.id ? highlightColor : bgColor}
                borderRadius="md"
                borderWidth={1}
                borderColor={borderColor}
                width="250px"
                cursor="pointer"
                onClick={() => setSelectedMatch(match)}
                as={motion.div}
                whileHover={{ scale: 1.02 }}
                position="relative"
              >
                {match.status === "in_progress" && (
                  <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme="green"
                  >
                    Live
                  </Badge>
                )}

                {[match.participant1, match.participant2].map(
                  (participant, i) => (
                    <HStack
                      key={i}
                      spacing={3}
                      py={2}
                      opacity={
                        match.winner && match.winner.id !== participant?.id
                          ? 0.5
                          : 1
                      }
                    >
                      <Avatar
                        size="sm"
                        src={participant?.avatar}
                        name={participant?.name}
                      />
                      <Text fontWeight="medium">
                        {participant?.name || "TBD"}
                      </Text>
                      {match.score && (
                        <Badge ml="auto">{match.score.split("-")[i]}</Badge>
                      )}
                    </HStack>
                  ),
                )}

                {match.spectator_count > 0 && (
                  <HStack spacing={1} mt={2} fontSize="sm" color="gray.500">
                    <Icon as={FaEye} />
                    <Text>{match.spectator_count}</Text>
                  </HStack>
                )}
              </Box>
            ))}
          </VStack>
        ))}
      </Grid>
    );
  };

  const renderMatchDetails = () => {
    if (!selectedMatch) return null;

    return (
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        p={4}
        bg={bgColor}
        borderTopWidth={1}
        borderColor={borderColor}
        shadow="lg"
        as={motion.div}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <Button
              leftIcon={<Icon as={FaPlay} />}
              colorScheme="blue"
              isDisabled={selectedMatch.status !== "in_progress"}
            >
              Watch Live
            </Button>

            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">
                {selectedMatch.participant1?.name} vs{" "}
                {selectedMatch.participant2?.name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Round {selectedMatch.round} - Match {selectedMatch.match_number}
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={4}>
            {selectedMatch.status === "in_progress" && (
              <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                LIVE
              </Badge>
            )}
            <Button variant="ghost" onClick={() => setSelectedMatch(null)}>
              Close
            </Button>
          </HStack>
        </Flex>
      </Box>
    );
  };

  if (!tournament) {
    return (
      <Flex justify="center" align="center" height="400px">
        <Text>Loading tournament...</Text>
      </Flex>
    );
  }

  return (
    <Box>
      {renderTournamentHeader()}
      {renderBracket()}
      <AnimatePresence>{selectedMatch && renderMatchDetails()}</AnimatePresence>
    </Box>
  );
};

export default TournamentView;
