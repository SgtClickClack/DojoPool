import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  Heading,
  Stat as ChakraStat,
  useColorModeValue,
  Icon,
  Tooltip,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
} from "@chakra-ui/react";
import { Stage, Layer, Circle as KonvaCircle, Line as KonvaLine, Arrow } from "react-konva";
import Konva from "konva";
import { FaBullseye, FaChartLine, FaRegDotCircle, FaArrowLeft, FaArrowRight, FaPlay, FaStop } from "react-icons/fa";
import TimelineChart from './TimelineChart';
import PerformanceInsights from './PerformanceInsights';

// --- Constants for Konva Visualization ---
const TABLE_VIS_WIDTH = 500;
const TABLE_VIS_HEIGHT = 250;
const TABLE_BORDER_WIDTH = 2;
const POCKET_RADIUS = 9;
const BALL_RADIUS = 7;
const POCKET_POSITIONS = [
  { x: 0, y: 0 }, { x: TABLE_VIS_WIDTH / 2, y: 0 }, { x: TABLE_VIS_WIDTH, y: 0 },
  { x: 0, y: TABLE_VIS_HEIGHT }, { x: TABLE_VIS_WIDTH / 2, y: TABLE_VIS_HEIGHT }, { x: TABLE_VIS_WIDTH, y: TABLE_VIS_HEIGHT },
];
const CUE_BALL_COLOR = "white";
const OBJECT_BALL_COLOR = "red"; // Example, could be dynamic based on shot.type or ball number
const TARGET_LINE_COLOR = "blue.400";

// --- Interfaces ---
interface Shot {
  id: string;
  type: string; // e.g., 'pot', 'safety', 'break'
  success: boolean;
  difficulty: number; // e.g., 0-10 scale
  position_score: number; // e.g., 0-1 quality of cue ball position after shot
  cue_ball_start: { x: number; y: number }; // Assuming these are scaled to TABLE_VIS_WIDTH/HEIGHT
  cue_ball_end: { x: number; y: number };   // or require scaling
  object_ball_start: { x: number; y: number };
  target_pocket?: { x: number; y: number };
  // Add other relevant details: e.g., intended_path, actual_path for cue_ball_end/object_ball_end
}

interface GameStats {
  accuracy: number; // 0-1
  avg_difficulty: number; // Match Shot.difficulty scale
  position_score: number; // 0-1
  break_success?: number; // Optional, 0-1
  game_duration?: number; // In seconds or minutes
  // Optional fields for comparison if available from API
  previous_accuracy?: number;
  previous_avg_difficulty?: number;
  previous_position_score?: number;
}

interface PerformanceInsight {
  type: "strength" | "weakness" | "improvement" | "neutral";
  title: string;
  description: string;
  metrics?: Record<string, string | number>; // Can be flexible
}

// --- Component Props ---
interface GameAnalysisViewProps {
  gameId: string;
}

const GameAnalysisView: React.FC<GameAnalysisViewProps> = ({ gameId }) => {
  const [shots, setShots] = useState<Shot[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const stageRef = useRef<Konva.Stage | null>(null);
  const replayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const cardBgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
    const fetchGameData = async () => {
      setIsLoading(true);
      setFetchError(null);
      // Reset states for new gameId
      setShots([]);
      setStats(null);
      setInsights([]);
      setCurrentShotIndex(0);

      try {
        const response = await fetch(`/api/games/${gameId}/analysis`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Server error" }));
          throw new Error(errorData.message || `Failed to fetch game analysis (HTTP ${response.status})`);
        }
        const data = await response.json();
        // Add validation for data structure here if necessary
        setShots(data.shots || []);
        setStats(data.stats || null);
        setInsights(data.insights || []);
      } catch (error: any) {
        console.error("Error fetching game data:", error);
        setFetchError(error.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    if (gameId) {
      fetchGameData();
    } else {
      setIsLoading(false);
      setFetchError("No Game ID provided.");
    }

    // Cleanup on unmount or if gameId changes (stops replay)
    return () => {
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
      }
      setIsPlayingReplay(false);
    };
  }, [gameId]);

  const currentShotData = shots[currentShotIndex];

  const handlePreviousShot = useCallback(() => {
    setCurrentShotIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextShot = useCallback(() => {
    setCurrentShotIndex((prev) => Math.min(shots.length - 1, prev + 1));
  }, [shots.length]);

  const handleSelectShot = useCallback((index: number) => {
    if (index >= 0 && index < shots.length) {
      setCurrentShotIndex(index);
    }
  }, [shots.length]);


  const playReplay = useCallback(() => {
    if (shots.length === 0) return;
    setIsPlayingReplay(true);
    setCurrentShotIndex(0); // Start from the first shot

    const playNextShot = (index: number) => {
      if (index >= shots.length) {
        setIsPlayingReplay(false);
        return;
      }
      setCurrentShotIndex(index);
      replayTimeoutRef.current = setTimeout(() => playNextShot(index + 1), 1000); // 1s per shot
    };

    playNextShot(0);
  }, [shots.length]);

  const stopReplay = useCallback(() => {
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
    }
    setIsPlayingReplay(false);
    // Optionally reset to first shot or stay on current
    // setCurrentShotIndex(0);
  }, []);


  const renderShotVisualization = () => {
    if (!currentShotData) {
      return (
        <Flex justify="center" align="center" h={TABLE_VIS_HEIGHT} borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Text color={textColor}>No shot data to display.</Text>
        </Flex>
      );
    }
    const shot = currentShotData;

    // TODO: Implement scaling if your shot coordinates are not already in pixels for the visualization size
    // const scaleX = (gameX: number) => (gameX / ACTUAL_TABLE_WIDTH_UNITS) * TABLE_VIS_WIDTH;
    // const scaleY = (gameY: number) => (gameY / ACTUAL_TABLE_HEIGHT_UNITS) * TABLE_VIS_HEIGHT;

    return (
      <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden" bg={useColorModeValue("green.50", "green.900")}>
        <Stage width={TABLE_VIS_WIDTH} height={TABLE_VIS_HEIGHT} ref={stageRef}>
          <Layer>
            {/* Table Outline (using a Rect might be simpler for fill) */}
            <KonvaLine
              points={[0, 0, TABLE_VIS_WIDTH, 0, TABLE_VIS_WIDTH, TABLE_VIS_HEIGHT, 0, TABLE_VIS_HEIGHT, 0, 0]}
              stroke={borderColor}
              strokeWidth={TABLE_BORDER_WIDTH}
            />
            {/* Pockets */}
            {POCKET_POSITIONS.map((pocket, i) => (
              <KonvaCircle key={`pocket-${i}`} x={pocket.x} y={pocket.y} radius={POCKET_RADIUS} fill={useColorModeValue("gray.700", "black")} />
            ))}

            {/* Cue Ball Start Position */}
            <KonvaCircle
              x={shot.cue_ball_start.x}
              y={shot.cue_ball_start.y}
              radius={BALL_RADIUS}
              fill={CUE_BALL_COLOR}
              stroke="black"
              strokeWidth={1}
              shadowBlur={5}
              shadowColor="rgba(0,0,0,0.3)"
            />
            {/* Object Ball Start Position */}
            <KonvaCircle
              x={shot.object_ball_start.x}
              y={shot.object_ball_start.y}
              radius={BALL_RADIUS}
              fill={OBJECT_BALL_COLOR} // This could be dynamic based on ball type
              shadowBlur={5}
              shadowColor="rgba(0,0,0,0.3)"
            />
            {/* Shot Path (Cue Ball to Object Ball) */}
            <Arrow
              points={[
                shot.cue_ball_start.x, shot.cue_ball_start.y,
                shot.object_ball_start.x, shot.object_ball_start.y,
              ]}
              pointerLength={8}
              pointerWidth={8}
              fill={shot.success ? "green.500" : "red.500"}
              stroke={shot.success ? "green.500" : "red.500"}
              strokeWidth={2}
              dash={[6, 3]}
            />
            {/* Intended Path (Object Ball to Target Pocket) */}
            {shot.target_pocket && (
              <Arrow
                points={[
                  shot.object_ball_start.x, shot.object_ball_start.y,
                  shot.target_pocket.x, shot.target_pocket.y,
                ]}
                pointerLength={6}
                pointerWidth={6}
                fill={TARGET_LINE_COLOR}
                stroke={TARGET_LINE_COLOR}
                strokeWidth={1.5}
                dash={[3, 3]}
              />
            )}
            {/* Actual Cue Ball End Position (if available and different from intent) */}
            {shot.cue_ball_end && (
                 <KonvaCircle
                    x={shot.cue_ball_end.x}
                    y={shot.cue_ball_end.y}
                    radius={BALL_RADIUS -1} // Slightly smaller to differentiate
                    fill={CUE_BALL_COLOR}
                    stroke="gray"
                    strokeWidth={1}
                    opacity={0.7}
                    dash={[2,2]}
                />
            )}
          </Layer>
        </Stage>
      </Box>
    );
  };

  const renderPerformanceStats = () => {
    if (!stats) return null;

    const calculateChangeDisplay = (current?: number, previous?: number) => {
        if (current === undefined || previous === undefined || previous === 0) {
            return { text: "N/A", type: "neutral" as const };
        }
        const changePercent = ((current - previous) / previous) * 100;
        return {
            text: `${Math.abs(changePercent).toFixed(1)}% ${current > previous ? "up" : "down"}`,
            type: changePercent > 0 ? "increase" : "decrease" as const,
        };
    };

    const statItems = [
      {
        label: "Accuracy",
        value: `${(stats.accuracy * 100).toFixed(1)}%`,
        icon: FaBullseye,
        change: calculateChangeDisplay(stats.accuracy, stats.previous_accuracy),
      },
      {
        label: "Avg Difficulty",
        value: stats.avg_difficulty.toFixed(1), // Assuming 0-10 scale
        icon: FaChartLine,
        change: calculateChangeDisplay(stats.avg_difficulty, stats.previous_avg_difficulty),
      },
      {
        label: "Position Play",
        value: `${(stats.position_score * 100).toFixed(1)}%`,
        icon: FaRegDotCircle,
        change: calculateChangeDisplay(stats.position_score, stats.previous_position_score),
      },
    ];

    return (
      <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap={4}>
        {statItems.map((item) => (
          <ChakraStat.Root // Using aliased import
            key={item.label}
            p={4}
            bg={cardBgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            boxShadow="sm"
          >
            <Flex alignItems="center" mb={1}>
              <Icon as={item.icon} color="blue.500" boxSize={5} />
              <ChakraStat.Label ml={2} fontSize="sm" color={textColor} fontWeight="medium">
                {item.label}
              </ChakraStat.Label>
            </Flex>
            <ChakraStat.ValueText fontSize="2xl" fontWeight="bold" color={headingColor}>
              {item.value}
            </ChakraStat.ValueText>
            {item.change.type !== "neutral" && (
              <ChakraStat.HelpText mt={1} fontSize="xs">
                {item.change.type === "increase" ? <ChakraStat.UpIndicator /> : <ChakraStat.DownIndicator />}
                {item.change.text}
              </ChakraStat.HelpText>
            )}
          </ChakraStat.Root>
        ))}
      </Grid>
    );
  };

  // --- Main Render Logic ---
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px" bg={bgColor}>
        <Spinner size="xl" thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />
        <Text ml={4} fontSize="lg" color={textColor}>Loading Game Analysis...</Text>
      </Flex>
    );
  }

  if (fetchError) {
    return (
      <Box p={5} bg={bgColor}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <Heading as="h4" size="md">Failed to Load Analysis</Heading>
            <Text>{fetchError}</Text>
            <Button mt={4} colorScheme="blue" onClick={() => window.location.reload()}>Try Again</Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (shots.length === 0 && !stats) {
    return (
      <Box p={5} bg={bgColor}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Heading as="h4" size="md">No Data Available</Heading>
            <Text>There is no analysis data available for game ID: {gameId}.</Text>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ base: 3, md: 5 }} bg={bgColor} minH="100vh">
      <Heading as="h1" size="lg" mb={6} color={headingColor} textAlign="center">
        Game Analysis: <Text as="span" color="blue.500" fontWeight="bold">{gameId}</Text>
      </Heading>

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={{ base: 4, lg: 6 }}>
        {/* Left Column: Visualization and Timeline */}
        <Box bg={cardBgColor} p={5} borderRadius="lg" boxShadow="md">
          <Heading as="h2" size="md" mb={4} color={headingColor}>Shot Replay</Heading>
          {renderShotVisualization()}
          <Flex mt={4} justifyContent="center" alignItems="center" wrap="wrap" gap={2}>
            <Tooltip label="Previous Shot" placement="top">
              <IconButton
                _icon={<FaArrowLeft />}
                aria-label="Previous Shot"
                onClick={handlePreviousShot}
                isDisabled={currentShotIndex === 0 || isPlayingReplay}
              />
            </Tooltip>
            <Text mx={3} color={textColor} fontSize="sm" whiteSpace="nowrap">
              Shot {shots.length > 0 ? currentShotIndex + 1 : 0} of {shots.length}
            </Text>
            <Tooltip label="Next Shot" placement="top">
              <IconButton
                _icon={<FaArrowRight />}
                aria-label="Next Shot"
                onClick={handleNextShot}
                isDisabled={currentShotIndex >= shots.length - 1 || isPlayingReplay}
              />
            </Tooltip>
            {!isPlayingReplay ? (
              <Tooltip label="Play Replay" placement="top">
                <IconButton
                  _icon={<FaPlay />}
                  aria-label="Play Replay"
                  colorScheme="green"
                  onClick={playReplay}
                  isDisabled={shots.length === 0}
                />
              </Tooltip>
            ) : (
              <Tooltip label="Stop Replay" placement="top">
                <IconButton
                  _icon={<FaStop />}
                  aria-label="Stop Replay"
                  colorScheme="red"
                  onClick={stopReplay}
                />
              </Tooltip>
            )}
          </Flex>
          
          {shots.length > 0 && (
            <Box mt={8}>
              <Heading as="h3" size="sm" mb={3} color={headingColor}>Shot Timeline</Heading>
              <TimelineChart shots={shots} currentShotIndex={currentShotIndex} onSelectShot={handleSelectShot} />
            </Box>
          )}
        </Box>

        {/* Right Column: Stats and Insights */}
        <Box display="flex" flexDirection="column" gap={{ base: 4, lg: 6 }}>
            {stats && (
                <Box bg={cardBgColor} p={5} borderRadius="lg" boxShadow="md">
                    <Heading as="h2" size="md" mb={4} color={headingColor}>Performance Stats</Heading>
                    {renderPerformanceStats()}
                </Box>
            )}
            {insights && insights.length > 0 && (
                <Box bg={cardBgColor} p={5} borderRadius="lg" boxShadow="md" flexGrow={1}>
                    <Heading as="h2" size="md" mb={4} color={headingColor}>Key Insights</Heading>
                    <PerformanceInsights insights={insights} />
                </Box>
            )}
             {(!insights || insights.length === 0) && !isLoading && (
                 <Box bg={cardBgColor} p={5} borderRadius="lg" boxShadow="md">
                     <Text color={textColor}>No specific performance insights generated for this game.</Text>
                 </Box>
             )}
        </Box>
      </Grid>
    </Box>
  );
};

export default GameAnalysisView;