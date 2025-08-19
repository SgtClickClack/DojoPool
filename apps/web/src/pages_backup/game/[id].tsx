import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Badge,
  Button,
  IconButton,
  Tooltip,
  useToast,
  Divider,
  Text,
  VStack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  useClipboard,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  FiShare2,
  FiDownload,
  FiRefreshCw,
  FiClock,
  FiUsers,
  FiSettings,
  FiFlag,
  FiAward,
  FiTrendingUp,
  FiCopy,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiHelpCircle,
} from 'react-icons/fi';
import GameTracker from '../../features/game/GameTracker';
import GameAnalysis from '../../features/game/GameAnalysis';
import { useAuth } from '../../hooks/useAuth';

interface GameData {
  id: string;
  player1: {
    id: string;
    name: string;
    score: number;
  };
  player2: {
    id: string;
    name: string;
    score: number;
  };
  shots: Array<{
    playerId: string;
    type: 'pot' | 'miss' | 'foul';
    ballNumber?: number;
    timestamp: number;
    position?: {
      x: number;
      y: number;
    };
  }>;
  status: 'active' | 'completed';
  startTime: number;
  endTime?: number;
  duration?: number;
  winner?: {
    id: string;
    name: string;
  };
}

const GamePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { hasCopied, onCopy } = useClipboard(window.location.href);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<
    Array<{
      id: string;
      userId: string;
      userName: string;
      text: string;
      timestamp: number;
    }>
  >([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    includeStats: true,
    includeComments: true,
    includeReplay: true,
  });
  const [showReplay, setShowReplay] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievements, setAchievements] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      unlocked: boolean;
      timestamp?: number;
    }>
  >([]);

  const fetchGameData = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      const response = await fetch(`/api/games/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game data');
      }
      const data = await response.json();
      setGameData(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load game data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, [id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGameData();
  };

  const handleComment = async () => {
    if (!comment.trim() || !user) return;

    const newComment = {
      id: Date.now().toString(),
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      text: comment.trim(),
      timestamp: Date.now(),
    };

    try {
      // Add comment to Firestore
      await db
        .collection('games')
        .doc(id as string)
        .collection('comments')
        .add(newComment);
      setComments([...comments, newComment]);
      setComment('');
      toast({
        title: 'Comment added',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleShare = async () => {
    setShowShareModal(true);
  };

  const handleExport = async () => {
    if (!gameData) return;

    const exportData = {
      ...gameData,
      comments: shareOptions.includeComments ? comments : undefined,
      statistics: shareOptions.includeStats
        ? {
            player1Stats,
            player2Stats,
          }
        : undefined,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${gameData.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReplay = () => {
    setShowReplay(true);
    setCurrentReplayIndex(0);
    setIsReplayPlaying(false);
  };

  const toggleReplay = () => {
    setIsReplayPlaying(!isReplayPlaying);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReplayPlaying && showReplay && gameData) {
      interval = setInterval(() => {
        setCurrentReplayIndex((prev) => {
          if (prev >= gameData.shots.length - 1) {
            setIsReplayPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / replaySpeed);
    }
    return () => clearInterval(interval);
  }, [isReplayPlaying, showReplay, gameData, replaySpeed]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
      >
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading game data...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !gameData) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Game not found'}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const gameDuration = gameData.endTime
    ? Math.floor((gameData.endTime - gameData.startTime) / 1000)
    : Math.floor((Date.now() - gameData.startTime) / 1000);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Game Header */}
        <Card bg={bgColor} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="lg">
                  {gameData.player1.name} vs {gameData.player2.name}
                </Heading>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Game options"
                    icon={<FiSettings />}
                    variant="ghost"
                  />
                  <MenuList>
                    <MenuItem icon={<FiShare2 />} onClick={handleShare}>
                      Share Game
                    </MenuItem>
                    <MenuItem icon={<FiDownload />} onClick={handleExport}>
                      Export Data
                    </MenuItem>
                    <MenuItem icon={<FiRefreshCw />} onClick={handleRefresh}>
                      Refresh
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      icon={<FiFlag />}
                      onClick={() => setShowReplay(true)}
                    >
                      Show Replay
                    </MenuItem>
                    <MenuItem
                      icon={<FiAward />}
                      onClick={() => setShowAchievements(true)}
                    >
                      View Achievements
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Stat>
                  <StatLabel>Game Duration</StatLabel>
                  <StatNumber>
                    <HStack>
                      <FiClock />
                      <Text>{formatDuration(gameDuration)}</Text>
                    </HStack>
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Status</StatLabel>
                  <StatNumber>
                    <Badge
                      colorScheme={
                        gameData.status === 'active' ? 'green' : 'blue'
                      }
                    >
                      {gameData.status === 'active'
                        ? 'In Progress'
                        : 'Completed'}
                    </Badge>
                  </StatNumber>
                  {gameData.winner && (
                    <StatHelpText>Winner: {gameData.winner.name}</StatHelpText>
                  )}
                </Stat>
                <Stat>
                  <StatLabel>Total Shots</StatLabel>
                  <StatNumber>{gameData.shots.length}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {Math.round(
                      (gameData.shots.length / gameDuration) * 60
                    )}{' '}
                    shots per minute
                  </StatHelpText>
                </Stat>
              </SimpleGrid>

              <Divider />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Card
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderColor="blue.200"
                >
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{gameData.player1.name}</Text>
                        <Badge colorScheme="blue">Player 1</Badge>
                      </HStack>
                      <Stat>
                        <StatLabel>Score</StatLabel>
                        <StatNumber>{gameData.player1.score}</StatNumber>
                        <StatHelpText>
                          {Math.round(
                            (gameData.player1.score / gameData.shots.length) *
                              100
                          )}
                          % success rate
                        </StatHelpText>
                      </Stat>
                      <Progress
                        value={
                          (gameData.player1.score / gameData.shots.length) * 100
                        }
                        colorScheme="blue"
                        size="sm"
                      />
                    </VStack>
                  </CardBody>
                </Card>

                <Card
                  bg={useColorModeValue('green.50', 'green.900')}
                  borderColor="green.200"
                >
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{gameData.player2.name}</Text>
                        <Badge colorScheme="green">Player 2</Badge>
                      </HStack>
                      <Stat>
                        <StatLabel>Score</StatLabel>
                        <StatNumber>{gameData.player2.score}</StatNumber>
                        <StatHelpText>
                          {Math.round(
                            (gameData.player2.score / gameData.shots.length) *
                              100
                          )}
                          % success rate
                        </StatHelpText>
                      </Stat>
                      <Progress
                        value={
                          (gameData.player2.score / gameData.shots.length) * 100
                        }
                        colorScheme="green"
                        size="sm"
                      />
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              <Accordion allowMultiple>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <FiInfo />
                          <Text>Game Information</Text>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <List spacing={3}>
                      <ListItem>
                        <ListIcon as={FiClock} />
                        Game Duration: {formatDuration(gameDuration)}
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiUsers} />
                        Total Shots: {gameData.shots.length}
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiTrendingUp} />
                        Shots per Minute:{' '}
                        {Math.round(
                          (gameData.shots.length / gameDuration) * 60
                        )}
                      </ListItem>
                      {gameData.winner && (
                        <ListItem>
                          <ListIcon as={FiAward} />
                          Winner: {gameData.winner.name}
                        </ListItem>
                      )}
                    </List>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </VStack>
          </CardBody>
        </Card>

        {/* Game Content */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Live Game</Tab>
            <Tab>Analysis</Tab>
            <Tab>Comments</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Box
                p={6}
                bg={bgColor}
                borderColor={borderColor}
                borderWidth={1}
                borderRadius="lg"
              >
                <GameTracker gameId={gameData.id} />
              </Box>
            </TabPanel>

            <TabPanel>
              <Box
                p={6}
                bg={bgColor}
                borderColor={borderColor}
                borderWidth={1}
                borderRadius="lg"
              >
                <GameAnalysis
                  gameId={gameData.id}
                  shots={gameData.shots}
                  player1={gameData.player1}
                  player2={gameData.player2}
                />
              </Box>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Card bg={bgColor} borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <Input
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <Button
                          colorScheme="blue"
                          onClick={handleComment}
                          isDisabled={!comment.trim() || !user}
                        >
                          Comment
                        </Button>
                      </HStack>
                      {!user && (
                        <Alert status="info">
                          <AlertIcon />
                          Please sign in to comment
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                <VStack spacing={4} align="stretch">
                  {comments.map((comment) => (
                    <Card
                      key={comment.id}
                      bg={bgColor}
                      borderColor={borderColor}
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">{comment.userName}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </Text>
                          </HStack>
                          <Text>{comment.text}</Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share Game</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Include Statistics</FormLabel>
                <Switch
                  isChecked={shareOptions.includeStats}
                  onChange={(e) =>
                    setShareOptions((prev) => ({
                      ...prev,
                      includeStats: e.target.checked,
                    }))
                  }
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Include Comments</FormLabel>
                <Switch
                  isChecked={shareOptions.includeComments}
                  onChange={(e) =>
                    setShareOptions((prev) => ({
                      ...prev,
                      includeComments: e.target.checked,
                    }))
                  }
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Include Replay</FormLabel>
                <Switch
                  isChecked={shareOptions.includeReplay}
                  onChange={(e) =>
                    setShareOptions((prev) => ({
                      ...prev,
                      includeReplay: e.target.checked,
                    }))
                  }
                />
              </FormControl>
              <HStack w="100%">
                <Input value={window.location.href} isReadOnly />
                <IconButton
                  aria-label="Copy link"
                  icon={hasCopied ? <FiCheck /> : <FiCopy />}
                  onClick={onCopy}
                  colorScheme={hasCopied ? 'green' : 'blue'}
                />
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setShowShareModal(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Replay Modal */}
      <Modal isOpen={showReplay} onClose={() => setShowReplay(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Game Replay</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box w="100%" h="400px" bg="gray.100" borderRadius="md">
                {/* Replay visualization component */}
              </Box>
              <HStack spacing={4}>
                <Button
                  leftIcon={isReplayPlaying ? <FiPause /> : <FiPlay />}
                  onClick={toggleReplay}
                >
                  {isReplayPlaying ? 'Pause' : 'Play'}
                </Button>
                <Select
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="4">4x</option>
                </Select>
                <Text>
                  Shot {currentReplayIndex + 1} of {gameData?.shots.length}
                </Text>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowReplay(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Achievements Modal */}
      <Modal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Achievements</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  bg={achievement.unlocked ? 'green.50' : 'gray.50'}
                  borderColor={achievement.unlocked ? 'green.200' : 'gray.200'}
                >
                  <CardBody>
                    <HStack spacing={4}>
                      <Icon
                        as={achievement.unlocked ? FiAward : FiLock}
                        color={achievement.unlocked ? 'green.500' : 'gray.500'}
                        boxSize={6}
                      />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{achievement.title}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {achievement.description}
                        </Text>
                        {achievement.unlocked && achievement.timestamp && (
                          <Text fontSize="xs" color="gray.500">
                            Unlocked:{' '}
                            {new Date(achievement.timestamp).toLocaleString()}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setShowAchievements(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default GamePage;
