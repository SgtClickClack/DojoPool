import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Text,
  CircularProgress,
  useTheme,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  HStack,
  Badge,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  VStack,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import BallDistributionPieChart from './BallDistributionPieChart';
import { prepareBallDistributionData } from './gameAnalysisUtils';

interface Shot {
  playerId: string;
  type: "pot" | "miss" | "foul";
  ballNumber?: number;
  timestamp: number;
  position?: {
    x: number;
    y: number;
  };
}

interface PlayerStats {
  totalShots: number;
  successfulShots: number;
  fouls: number;
  averageShotTime: number;
  ballDistribution: Record<number, number>;
  shotSuccessRate: number;
  maxConsecutiveShots: number;
  shotPatterns: Record<string, number>;
  positionStats: Record<string, { total: number; successful: number }>;
  shotAccuracyByBall: Record<number, { total: number; successful: number }>;
  shotAccuracyByPosition: Record<string, { total: number; successful: number }>;
  averageShotTimeByBall: Record<number, number>;
  consecutiveShotsByBall: Record<number, number>;
  breakAndRun: number;
  highestBreak: number;
  averageBreak: number;
  safetyPlayPercentage: number;
  offensivePlayPercentage: number;
  defensivePlayPercentage: number;
}

interface GameAnalysisProps {
  gameId: string;
  shots: Shot[];
  player1: {
    id: string;
    name: string;
  };
  player2: {
    id: string;
    name: string;
  };
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const GameAnalysis: React.FC<GameAnalysisProps> = ({
  gameId,
  shots,
  player1,
  player2,
}) => {
  const theme = useTheme();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const [loading, setLoading] = useState(true);
  const [player1Stats, setPlayer1Stats] = useState<PlayerStats | null>(null);
  const [player2Stats, setPlayer2Stats] = useState<PlayerStats | null>(null);

  // Calculate additional statistics
  const calculateAdvancedStats = (
    playerId: string,
    shots: Shot[],
  ): PlayerStats => {
    const playerShots = shots.filter((shot) => shot.playerId === playerId);

    // Calculate consecutive shots
    let maxConsecutiveShots = 0;
    let currentConsecutiveShots = 0;
    playerShots.forEach((shot) => {
      if (shot.type === "pot") {
        currentConsecutiveShots++;
        maxConsecutiveShots = Math.max(
          maxConsecutiveShots,
          currentConsecutiveShots,
        );
      } else {
        currentConsecutiveShots = 0;
      }
    });

    // Calculate shot patterns
    const shotPatterns = playerShots.reduce(
      (acc, shot, index) => {
        if (index === 0) return acc;
        const pattern = `${playerShots[index - 1].type}-${shot.type}`;
        acc[pattern] = (acc[pattern] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate position-based success rate
    const positionStats = playerShots.reduce(
      (acc, shot) => {
        if (!shot.position) return acc;
        const x = Math.floor(shot.position.x * 10) / 10;
        const y = Math.floor(shot.position.y * 10) / 10;
        const key = `${x},${y}`;
        if (!acc[key]) {
          acc[key] = { total: 0, successful: 0 };
        }
        acc[key].total++;
        if (shot.type === "pot") acc[key].successful++;
        return acc;
      },
      {} as Record<string, { total: number; successful: number }>,
    );

    // Calculate shot accuracy by ball
    const shotAccuracyByBall = playerShots.reduce(
      (acc, shot) => {
        if (!shot.ballNumber) return acc;
        if (!acc[shot.ballNumber]) {
          acc[shot.ballNumber] = { total: 0, successful: 0 };
        }
        acc[shot.ballNumber].total++;
        if (shot.type === "pot") acc[shot.ballNumber].successful++;
        return acc;
      },
      {} as Record<number, { total: number; successful: number }>,
    );

    // Calculate average shot time by ball
    const averageShotTimeByBall = playerShots.reduce(
      (acc, shot, index) => {
        if (!shot.ballNumber || index === 0) return acc;
        const timeDiff = shot.timestamp - playerShots[index - 1].timestamp;
        if (!acc[shot.ballNumber]) {
          acc[shot.ballNumber] = { total: 0, count: 0 };
        }
        acc[shot.ballNumber].total += timeDiff;
        acc[shot.ballNumber].count++;
        return acc;
      },
      {} as Record<number, { total: number; count: number }>,
    );

    // Calculate consecutive shots by ball
    const consecutiveShotsByBall = playerShots.reduce(
      (acc, shot) => {
        if (!shot.ballNumber) return acc;
        if (!acc[shot.ballNumber]) {
          acc[shot.ballNumber] = 0;
        }
        if (shot.type === "pot") {
          acc[shot.ballNumber]++;
        } else {
          acc[shot.ballNumber] = 0;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    // Calculate break and run statistics
    let currentBreak = 0;
    let highestBreak = 0;
    let totalBreaks = 0;
    let breakCount = 0;

    playerShots.forEach((shot) => {
      if (shot.type === "pot") {
        currentBreak++;
        highestBreak = Math.max(highestBreak, currentBreak);
      } else {
        if (currentBreak > 0) {
          totalBreaks += currentBreak;
          breakCount++;
        }
        currentBreak = 0;
      }
    });

    // Calculate play style percentages
    const totalShots = playerShots.length;
    const safetyPlays = playerShots.filter(
      (shot) => shot.type === "foul",
    ).length;
    const offensivePlays = playerShots.filter(
      (shot) => shot.type === "pot",
    ).length;
    const defensivePlays = playerShots.filter(
      (shot) => shot.type === "miss",
    ).length;

    return {
      totalShots: playerShots.length,
      successfulShots: playerShots.filter((shot) => shot.type === "pot").length,
      fouls: playerShots.filter((shot) => shot.type === "foul").length,
      averageShotTime:
        playerShots
          .map((shot, index) => {
            if (index === 0) return 0;
            return shot.timestamp - playerShots[index - 1].timestamp;
          })
          .reduce((a, b) => a + b, 0) / playerShots.length,
      ballDistribution: playerShots.reduce(
        (acc, shot) => {
          if (shot.ballNumber) {
            acc[shot.ballNumber] = (acc[shot.ballNumber] || 0) + 1;
          }
          return acc;
        },
        {} as Record<number, number>,
      ),
      shotSuccessRate:
        (playerShots.filter((shot) => shot.type === "pot").length /
          playerShots.length) *
        100,
      maxConsecutiveShots,
      shotPatterns,
      positionStats,
      shotAccuracyByBall,
      shotAccuracyByPosition: positionStats,
      averageShotTimeByBall: Object.entries(averageShotTimeByBall).reduce(
        (acc, [ball, data]) => {
          acc[Number(ball)] = data.total / data.count;
          return acc;
        },
        {} as Record<number, number>,
      ),
      consecutiveShotsByBall,
      breakAndRun: highestBreak === totalShots ? 1 : 0,
      highestBreak,
      averageBreak: breakCount > 0 ? totalBreaks / breakCount : 0,
      safetyPlayPercentage: (safetyPlays / totalShots) * 100,
      offensivePlayPercentage: (offensivePlays / totalShots) * 100,
      defensivePlayPercentage: (defensivePlays / totalShots) * 100,
    };
  };

  useEffect(() => {
    const calculatePlayerStats = (
      playerId: string,
      shots: Shot[],
    ): PlayerStats => {
      const playerShots = shots.filter((shot) => shot.playerId === playerId);
      const successfulShots = playerShots.filter(
        (shot) => shot.type === "pot",
      ).length;
      const fouls = playerShots.filter((shot) => shot.type === "foul").length;

      // Calculate average shot time
      const shotTimes = playerShots.map((shot, index) => {
        if (index === 0) return 0;
        return shot.timestamp - playerShots[index - 1].timestamp;
      });
      const averageShotTime =
        shotTimes.reduce((a, b) => a + b, 0) / shotTimes.length;

      // Calculate ball distribution
      const ballDistribution: Record<number, number> = {};
      playerShots.forEach((shot) => {
        if (shot.ballNumber) {
          ballDistribution[shot.ballNumber] =
            (ballDistribution[shot.ballNumber] || 0) + 1;
        }
      });

      return {
        totalShots: playerShots.length,
        successfulShots,
        fouls,
        averageShotTime,
        ballDistribution,
        shotSuccessRate: (successfulShots / playerShots.length) * 100,
        maxConsecutiveShots: calculateAdvancedStats(playerId, shots)
          .maxConsecutiveShots,
        shotPatterns: calculateAdvancedStats(playerId, shots).shotPatterns,
        positionStats: calculateAdvancedStats(playerId, shots).positionStats,
        shotAccuracyByBall: calculateAdvancedStats(playerId, shots)
          .shotAccuracyByBall,
        shotAccuracyByPosition: calculateAdvancedStats(playerId, shots)
          .shotAccuracyByPosition,
        averageShotTimeByBall: calculateAdvancedStats(playerId, shots)
          .averageShotTimeByBall,
        consecutiveShotsByBall: calculateAdvancedStats(playerId, shots)
          .consecutiveShotsByBall,
        breakAndRun: calculateAdvancedStats(playerId, shots).breakAndRun,
        highestBreak: calculateAdvancedStats(playerId, shots).highestBreak,
        averageBreak: calculateAdvancedStats(playerId, shots).averageBreak,
        safetyPlayPercentage: calculateAdvancedStats(playerId, shots)
          .safetyPlayPercentage,
        offensivePlayPercentage: calculateAdvancedStats(playerId, shots)
          .offensivePlayPercentage,
        defensivePlayPercentage: calculateAdvancedStats(playerId, shots)
          .defensivePlayPercentage,
      };
    };

    setPlayer1Stats(calculatePlayerStats(player1.id, shots));
    setPlayer2Stats(calculatePlayerStats(player2.id, shots));
    setLoading(false);
  }, [shots, player1.id, player2.id]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!player1Stats || !player2Stats) {
    return (
      <Box p={4}>
        <Text>No game data available for analysis.</Text>
      </Box>
    );
  }

  // Prepare data for the timeline chart
  const timelineData = shots.map((shot, index) => ({
    shotNumber: index + 1,
    timestamp: shot.timestamp,
    player: shot.playerId === player1.id ? player1.name : player2.name,
    type: shot.type,
    ballNumber: shot.ballNumber,
  }));

  // Prepare data for the ball distribution pie chart
  const ballDistributionData = Object.entries(
    player1Stats.ballDistribution,
  ).map(([ball, count]) => ({
    name: `Ball ${ball}`,
    value: count,
  }));

  // Prepare data for heat map
  const heatMapData = Object.entries(player1Stats?.positionStats || {}).map(
    ([pos, stats]) => {
      const [x, y] = pos.split(",").map(Number);
      return {
        x,
        y,
        value: (stats.successful / stats.total) * 100,
      };
    },
  );

  // Prepare data for shot patterns
  const shotPatternData = Object.entries(player1Stats?.shotPatterns || {}).map(
    ([pattern, count]) => ({
      pattern,
      count,
    }),
  );

  return (
    <Box p={4}>
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Detailed Stats</Tab>
          <Tab>Shot Analysis</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
            >
              {/* Player Statistics Cards */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <HStack>
                    <Heading size="md">{player1.name}'s Statistics</Heading>
                    <Badge colorScheme="blue">Player 1</Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Total Shots</StatLabel>
                      <StatNumber>{player1Stats?.totalShots}</StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        Success Rate: {player1Stats?.shotSuccessRate.toFixed(1)}
                        %
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Fouls</StatLabel>
                      <StatNumber>{player1Stats?.fouls}</StatNumber>
                      <StatHelpText>
                        Penalty Points: {player1Stats?.fouls * 4}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Avg. Shot Time</StatLabel>
                      <StatNumber>
                        {player1Stats?.averageShotTime.toFixed(1)}s
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Max Streak</StatLabel>
                      <StatNumber>
                        {player1Stats?.maxConsecutiveShots}
                      </StatNumber>
                      <StatHelpText>Consecutive successful shots</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Similar card for player2 */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <HStack>
                    <Heading size="md">{player2.name}'s Statistics</Heading>
                    <Badge colorScheme="green">Player 2</Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Total Shots</StatLabel>
                      <StatNumber>{player2Stats?.totalShots}</StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        Success Rate: {player2Stats?.shotSuccessRate.toFixed(1)}
                        %
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Fouls</StatLabel>
                      <StatNumber>{player2Stats?.fouls}</StatNumber>
                      <StatHelpText>
                        Penalty Points: {player2Stats?.fouls * 4}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Avg. Shot Time</StatLabel>
                      <StatNumber>
                        {player2Stats?.averageShotTime.toFixed(1)}s
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Max Streak</StatLabel>
                      <StatNumber>
                        {player2Stats?.maxConsecutiveShots}
                      </StatNumber>
                      <StatHelpText>Consecutive successful shots</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Game Timeline */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Game Timeline</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <defs>
                          <linearGradient
                            id="colorTime"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8884d8"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8884d8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="shotNumber" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="timestamp"
                          stroke="#8884d8"
                          fillOpacity={1}
                          fill="url(#colorTime)"
                          name="Shot Timing"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
            >
              {/* Shot Patterns */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Shot Patterns</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shotPatternData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="pattern" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Frequency" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Ball Distribution */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Ball Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ballDistributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {ballDistributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Shot Success Rate Comparison */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Shot Success Rate Comparison</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          {
                            name: player1.name,
                            successRate: player1Stats?.shotSuccessRate,
                          },
                          {
                            name: player2.name,
                            successRate: player2Stats?.shotSuccessRate,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="successRate"
                          stroke="#82ca9d"
                          name="Success Rate (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
            >
              {/* Shot Heat Map */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Shot Heat Map</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="X Position" />
                        <YAxis type="number" dataKey="y" name="Y Position" />
                        <RechartsTooltip />
                        <Legend />
                        <Scatter
                          data={heatMapData}
                          fill="#8884d8"
                          name="Shot Success Rate"
                          shape="circle"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Shot Timing Distribution */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Shot Timing Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="shotNumber" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="timestamp"
                          fill="#82ca9d"
                          name="Time (ms)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Shot Type Distribution */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Shot Type Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Pot",
                              value: shots.filter((s) => s.type === "pot")
                                .length,
                            },
                            {
                              name: "Miss",
                              value: shots.filter((s) => s.type === "miss")
                                .length,
                            },
                            {
                              name: "Foul",
                              value: shots.filter((s) => s.type === "foul")
                                .length,
                            },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {shots.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
            >
              {/* Play Style Analysis */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Play Style Analysis</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box>
                      <Text fontWeight="bold" mb={4}>
                        {player1.name}'s Play Style
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        <Progress
                          value={player1Stats?.offensivePlayPercentage}
                          colorScheme="green"
                          size="sm"
                        >
                          <Text fontSize="sm">
                            Offensive:{" "}
                            {player1Stats?.offensivePlayPercentage.toFixed(1)}%
                          </Text>
                        </Progress>
                        <Progress
                          value={player1Stats?.defensivePlayPercentage}
                          colorScheme="yellow"
                          size="sm"
                        >
                          <Text fontSize="sm">
                            Defensive:{" "}
                            {player1Stats?.defensivePlayPercentage.toFixed(1)}%
                          </Text>
                        </Progress>
                        <Progress
                          value={player1Stats?.safetyPlayPercentage}
                          colorScheme="red"
                          size="sm"
                        >
                          <Text fontSize="sm">
                            Safety:{" "}
                            {player1Stats?.safetyPlayPercentage.toFixed(1)}%
                          </Text>
                        </Progress>
                      </VStack>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={4}>
                        {player2.name}'s Play Style
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        <Progress
                          value={player2Stats?.offensivePlayPercentage}
                          colorScheme="green"
                          size="sm"
                        >
                          <Text fontSize="sm">
                            Offensive:{" "}
                            {player2Stats?.offensivePlayPercentage.toFixed(1)}%
                          </Text>
                        </Progress>
                        <Progress
                          value={player2Stats?.defensivePlayPercentage}
                          colorScheme="yellow"
                          size="sm"
                        >
                          <Text fontSize="sm">
                            Defensive:{" "}
                            {player2Stats?.defensivePlayPercentage.toFixed(1)}%
                          </Text>
                        </Progress>
                        <Progress
                          value={player2Stats?.safetyPlayPercentage}
                          colorScheme="red"
                          size="sm"
                        >
                          <Text fontSize="sm">
                            Safety:{" "}
                            {player2Stats?.safetyPlayPercentage.toFixed(1)}%
                          </Text>
                        </Progress>
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Break Statistics */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Break Statistics</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box>
                      <Text fontWeight="bold" mb={4}>
                        {player1.name}'s Breaks
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        <Stat>
                          <StatLabel>Highest Break</StatLabel>
                          <StatNumber>{player1Stats?.highestBreak}</StatNumber>
                          <StatHelpText>
                            Consecutive successful shots
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Average Break</StatLabel>
                          <StatNumber>
                            {player1Stats?.averageBreak.toFixed(1)}
                          </StatNumber>
                          <StatHelpText>Shots per break</StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Break and Run</StatLabel>
                          <StatNumber>{player1Stats?.breakAndRun}</StatNumber>
                          <StatHelpText>
                            Complete game without opponent's turn
                          </StatHelpText>
                        </Stat>
                      </VStack>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={4}>
                        {player2.name}'s Breaks
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        <Stat>
                          <StatLabel>Highest Break</StatLabel>
                          <StatNumber>{player2Stats?.highestBreak}</StatNumber>
                          <StatHelpText>
                            Consecutive successful shots
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Average Break</StatLabel>
                          <StatNumber>
                            {player2Stats?.averageBreak.toFixed(1)}
                          </StatNumber>
                          <StatHelpText>Shots per break</StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Break and Run</StatLabel>
                          <StatNumber>{player2Stats?.breakAndRun}</StatNumber>
                          <StatHelpText>
                            Complete game without opponent's turn
                          </StatHelpText>
                        </Stat>
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
            >
              {/* Shot Accuracy by Ball */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Shot Accuracy by Ball</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(
                          player1Stats?.shotAccuracyByBall || {},
                        ).map(([ball, stats]) => ({
                          ball: `Ball ${ball}`,
                          player1Accuracy:
                            (stats.successful / stats.total) * 100,
                          player2Accuracy:
                            ((player2Stats?.shotAccuracyByBall[Number(ball)]
                              ?.successful || 0) /
                              (player2Stats?.shotAccuracyByBall[Number(ball)]
                                ?.total || 1)) *
                            100,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ball" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="player1Accuracy"
                          fill="#8884d8"
                          name={`${player1.name}'s Accuracy`}
                        />
                        <Bar
                          dataKey="player2Accuracy"
                          fill="#82ca9d"
                          name={`${player2.name}'s Accuracy`}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Average Shot Time by Ball */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Average Shot Time by Ball</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={Object.entries(
                          player1Stats?.averageShotTimeByBall || {},
                        ).map(([ball, time]) => ({
                          ball: `Ball ${ball}`,
                          player1Time: time,
                          player2Time:
                            player2Stats?.averageShotTimeByBall[Number(ball)] ||
                            0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ball" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="player1Time"
                          stroke="#8884d8"
                          name={`${player1.name}'s Time`}
                        />
                        <Line
                          type="monotone"
                          dataKey="player2Time"
                          stroke="#82ca9d"
                          name={`${player2.name}'s Time`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
              gap={6}
            >
              {/* Shot Accuracy Heat Map */}
              <Card
                bg={bgColor}
                borderColor={borderColor}
                gridColumn={{ md: "span 2" }}
              >
                <CardHeader>
                  <Heading size="md">Shot Accuracy Heat Map</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="X Position" />
                        <YAxis type="number" dataKey="y" name="Y Position" />
                        <RechartsTooltip />
                        <Legend />
                        <Scatter
                          data={Object.entries(
                            player1Stats?.shotAccuracyByPosition || {},
                          ).map(([pos, stats]) => {
                            const [x, y] = pos.split(",").map(Number);
                            return {
                              x,
                              y,
                              value: (stats.successful / stats.total) * 100,
                            };
                          })}
                          fill="#8884d8"
                          name={`${player1.name}'s Accuracy`}
                          shape="circle"
                        />
                        <Scatter
                          data={Object.entries(
                            player2Stats?.shotAccuracyByPosition || {},
                          ).map(([pos, stats]) => {
                            const [x, y] = pos.split(",").map(Number);
                            return {
                              x,
                              y,
                              value: (stats.successful / stats.total) * 100,
                            };
                          })}
                          fill="#82ca9d"
                          name={`${player2.name}'s Accuracy`}
                          shape="square"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Shot Timing Distribution */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Shot Timing Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="shotNumber" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="timestamp"
                          fill="#82ca9d"
                          name="Time (ms)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>

              {/* Shot Type Distribution */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Shot Type Distribution</Heading>
                </CardHeader>
                <CardBody>
                  <Box height="300px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Pot",
                              value: shots.filter((s) => s.type === "pot")
                                .length,
                            },
                            {
                              name: "Miss",
                              value: shots.filter((s) => s.type === "miss")
                                .length,
                            },
                            {
                              name: "Foul",
                              value: shots.filter((s) => s.type === "foul")
                                .length,
                            },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {shots.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default GameAnalysis;
