import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Grid,
    Flex,
    Text,
    Heading,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useColorModeValue,
    Icon,
    Tooltip,
    Button
} from '@chakra-ui/react';
import { motion, useAnimation } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { FaRegDotCircle, FaBullseye, FaChartLine, FaTrophy } from 'react-icons/fa';
import { Stage, Layer, Circle, Line as KonvaLine, Arrow } from 'react-konva';

interface Shot {
    id: string;
    type: string;
    success: boolean;
    difficulty: number;
    position_score: number;
    cue_ball_start: { x: number; y: number };
    cue_ball_end: { x: number; y: number };
    object_ball_start: { x: number; y: number };
    target_pocket?: { x: number; y: number };
}

interface GameStats {
    accuracy: number;
    avg_difficulty: number;
    position_score: number;
    break_success: number;
    game_duration: number;
}

interface PerformanceInsight {
    type: 'strength' | 'weakness' | 'improvement';
    title: string;
    description: string;
    metrics: Record<string, number>;
}

const GameAnalysisView: React.FC<{ gameId: string }> = ({ gameId }) => {
    const [shots, setShots] = useState<Shot[]>([]);
    const [stats, setStats] = useState<GameStats | null>(null);
    const [insights, setInsights] = useState<PerformanceInsight[]>([]);
    const [currentShot, setCurrentShot] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const animationControls = useAnimation();
    const stageRef = useRef<any>(null);
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        // Fetch game data
        const fetchGameData = async () => {
            try {
                const response = await fetch(`/api/games/${gameId}/analysis`);
                const data = await response.json();
                setShots(data.shots);
                setStats(data.stats);
                setInsights(data.insights);
            } catch (error) {
                console.error('Error fetching game data:', error);
            }
        };
        
        fetchGameData();
    }, [gameId]);

    const renderShotVisualization = () => {
        if (!shots[currentShot]) return null;
        
        const shot = shots[currentShot];
        const tableWidth = 500;
        const tableHeight = 250;
        
        return (
            <Stage width={tableWidth} height={tableHeight} ref={stageRef}>
                <Layer>
                    {/* Table outline */}
                    <KonvaLine
                        points={[0, 0, tableWidth, 0, tableWidth, tableHeight, 0, tableHeight, 0, 0]}
                        stroke={borderColor}
                        strokeWidth={2}
                    />
                    
                    {/* Pockets */}
                    {[
                        { x: 0, y: 0 },
                        { x: tableWidth/2, y: 0 },
                        { x: tableWidth, y: 0 },
                        { x: 0, y: tableHeight },
                        { x: tableWidth/2, y: tableHeight },
                        { x: tableWidth, y: tableHeight }
                    ].map((pocket, i) => (
                        <Circle
                            key={i}
                            x={pocket.x}
                            y={pocket.y}
                            radius={8}
                            fill="gray"
                        />
                    ))}
                    
                    {/* Shot path */}
                    <Arrow
                        points={[
                            shot.cue_ball_start.x,
                            shot.cue_ball_start.y,
                            shot.object_ball_start.x,
                            shot.object_ball_start.y
                        ]}
                        stroke={shot.success ? 'green' : 'red'}
                        strokeWidth={2}
                        dash={[5, 5]}
                    />
                    
                    {/* Object ball */}
                    <Circle
                        x={shot.object_ball_start.x}
                        y={shot.object_ball_start.y}
                        radius={10}
                        fill="red"
                    />
                    
                    {/* Cue ball */}
                    <Circle
                        x={shot.cue_ball_start.x}
                        y={shot.cue_ball_start.y}
                        radius={10}
                        fill="white"
                        stroke="black"
                    />
                    
                    {/* Target pocket */}
                    {shot.target_pocket && (
                        <Arrow
                            points={[
                                shot.object_ball_start.x,
                                shot.object_ball_start.y,
                                shot.target_pocket.x,
                                shot.target_pocket.y
                            ]}
                            stroke="blue"
                            strokeWidth={1}
                            dash={[2, 2]}
                        />
                    )}
                </Layer>
            </Stage>
        );
    };

    const renderPerformanceStats = () => {
        if (!stats) return null;
        
        const statItems = [
            {
                label: 'Accuracy',
                value: `${(stats.accuracy * 100).toFixed(1)}%`,
                icon: FaBullseye,
                change: 5 // Example change value
            },
            {
                label: 'Avg Difficulty',
                value: (stats.avg_difficulty * 10).toFixed(1),
                icon: FaChartLine,
                change: -2
            },
            {
                label: 'Position Play',
                value: `${(stats.position_score * 100).toFixed(1)}%`,
                icon: FaRegDotCircle,
                change: 3
            }
        ];
        
        return (
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                {statItems.map((item, index) => (
                    <Stat
                        key={index}
                        px={4}
                        py={2}
                        shadow="base"
                        borderRadius="lg"
                        backgroundColor={bgColor}
                    >
                        <Flex align="center" mb={2}>
                            <Icon as={item.icon} color="blue.500" boxSize={5} />
                            <StatLabel ml={2}>{item.label}</StatLabel>
                        </Flex>
                        <StatNumber fontSize="2xl">{item.value}</StatNumber>
                        <StatHelpText>
                            <StatArrow type={item.change > 0 ? 'increase' : 'decrease'} />
                            {Math.abs(item.change)}% vs avg
                        </StatHelpText>
                    </Stat>
                ))}
            </Grid>
        );
    };

    const renderInsights = () => {
        if (!insights.length) return null;
        
        return (
            <Box mt={6}>
                <Heading size="md" mb={4}>Performance Insights</Heading>
                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                    {insights.map((insight, index) => (
                        <Box
                            key={index}
                            p={4}
                            borderRadius="lg"
                            backgroundColor={bgColor}
                            borderWidth={1}
                            borderColor={borderColor}
                        >
                            <Flex align="center" mb={2}>
                                <Icon
                                    as={FaTrophy}
                                    color={
                                        insight.type === 'strength' ? 'green.500' :
                                        insight.type === 'weakness' ? 'red.500' : 'blue.500'
                                    }
                                    boxSize={5}
                                />
                                <Text ml={2} fontWeight="bold">{insight.title}</Text>
                            </Flex>
                            <Text color="gray.600">{insight.description}</Text>
                        </Box>
                    ))}
                </Grid>
            </Box>
        );
    };

    const playReplay = async () => {
        setIsPlaying(true);
        
        for (let i = 0; i < shots.length; i++) {
            setCurrentShot(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        setIsPlaying(false);
    };

    return (
        <Box p={4}>
            <Heading mb={6}>Game Analysis</Heading>
            
            <Tabs variant="enclosed">
                <TabList>
                    <Tab>Shot Analysis</Tab>
                    <Tab>Performance</Tab>
                    <Tab>Trends</Tab>
                </TabList>
                
                <TabPanels>
                    <TabPanel>
                        <Flex direction="column" align="center">
                            <Box
                                width="100%"
                                maxW="800px"
                                borderWidth={1}
                                borderColor={borderColor}
                                borderRadius="lg"
                                overflow="hidden"
                                mb={4}
                            >
                                {renderShotVisualization()}
                            </Box>
                            
                            <Flex justify="center" mt={4}>
                                <Button
                                    leftIcon={isPlaying ? undefined : <Icon as={FaPlay} />}
                                    onClick={playReplay}
                                    isLoading={isPlaying}
                                    colorScheme="blue"
                                >
                                    {isPlaying ? 'Playing...' : 'Play Replay'}
                                </Button>
                            </Flex>
                        </Flex>
                    </TabPanel>
                    
                    <TabPanel>
                        {renderPerformanceStats()}
                        {renderInsights()}
                    </TabPanel>
                    
                    <TabPanel>
                        <Box height="400px">
                            <Line
                                data={{
                                    labels: shots.map((_, i) => `Shot ${i + 1}`),
                                    datasets: [
                                        {
                                            label: 'Shot Difficulty',
                                            data: shots.map(shot => shot.difficulty),
                                            borderColor: 'rgba(255, 99, 132, 1)',
                                            tension: 0.1
                                        },
                                        {
                                            label: 'Position Score',
                                            data: shots.map(shot => shot.position_score),
                                            borderColor: 'rgba(54, 162, 235, 1)',
                                            tension: 0.1
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 1
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default GameAnalysisView; 