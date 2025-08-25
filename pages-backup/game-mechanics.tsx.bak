import { Badge, Box, Button, Grid, Tab, TabPanel, Tabs } from '@mui/material';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AchievementPanel from '../src/components/Game/AchievementPanel';
import ChallengeCreationPanel from '../src/components/Game/ChallengeCreationPanel';
import GameBalancePanel from '../src/components/Game/GameBalancePanel';
import PlayerMovementPanel from '../src/components/Game/PlayerMovementPanel';
import RealTimeMatchTracker from '../src/components/Game/RealTimeMatchTracker';
import TerritoryControlPanel from '../src/components/Game/TerritoryControlPanel';
import PerformanceOptimizationPanel from '../src/components/performance/PerformanceOptimizationPanel';
import GameMechanicsService from '../src/services/GameMechanicsService';

// Advanced Components
const AdvancedChallengePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tournament');

  const createTournamentChallenge = async () => {
    try {
      const gameMechanics = new GameMechanicsService();
      const tournament = await gameMechanics.createTournamentChallenge({
        name: 'Brisbane Masters Tournament',
        dojoId: 'dojo-1',
        entryFee: 100,
        maxParticipants: 16,
        bracketType: 'single_elimination',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        rules: [
          'Single elimination bracket',
          'Best of 3 games',
          'Standard pool rules apply',
          'No coaching during matches',
        ],
        requirements: {
          minLevel: 5,
          minReputation: 100,
          clanMembership: false,
        },
      });

      toast.success(
        `Tournament "${tournament.tournamentName}" created successfully!`
      );
    } catch (error) {
      toast.error('Failed to create tournament challenge');
    }
  };

  const createClanChallenge = async () => {
    try {
      const gameMechanics = new GameMechanicsService();
      const clanChallenge = await gameMechanics.createClanChallenge({
        clanId: 'clan-1',
        clanName: 'Crimson Dragons',
        defendingClanId: 'clan-2',
        defendingClanName: 'Shadow Wolves',
        dojoId: 'dojo-1',
        territoryStakes: ['dojo-1', 'dojo-2', 'dojo-3'],
        diplomaticImplications: true,
        entryFee: 500,
        requirements: {
          minLevel: 10,
          minReputation: 500,
          clanMembership: true,
        },
      });

      toast.success(
        `Clan challenge between ${clanChallenge.clanName} and ${clanChallenge.defendingClanName} created!`
      );
    } catch (error) {
      toast.error('Failed to create clan challenge');
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Advanced Challenges
      </Heading>

      <Tabs
        onChange={(index) => setActiveTab(index === 0 ? 'tournament' : 'clan')}
      >
        <TabList>
          <Tab>Tournament Challenges</Tab>
          <Tab>Clan Challenges</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={4}>
                  Create Tournament Challenge
                </Heading>
                <Text mb={4}>
                  Organize large-scale tournaments with multiple participants,
                  brackets, and prizes.
                </Text>
                <Button colorScheme="blue" onClick={createTournamentChallenge}>
                  Create Tournament
                </Button>
              </Box>

              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={4}>
                  Active Tournaments
                </Heading>
                <VStack spacing={3} align="stretch">
                  <Box p={3} borderWidth={1} borderRadius="md">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">Brisbane Masters</Text>
                        <Text fontSize="sm" color="gray.600">
                          16 participants • Single Elimination
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Entry Fee: 100 coins
                        </Text>
                      </VStack>
                      <Badge colorScheme="green">Active</Badge>
                    </HStack>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={4}>
                  Create Clan Challenge
                </Heading>
                <Text mb={4}>
                  Challenge other clans for territory control and diplomatic
                  influence.
                </Text>
                <Button colorScheme="red" onClick={createClanChallenge}>
                  Create Clan Challenge
                </Button>
              </Box>

              <Box p={4} borderWidth={1} borderRadius="md">
                <Heading size="md" mb={4}>
                  Active Clan Wars
                </Heading>
                <VStack spacing={3} align="stretch">
                  <Box p={3} borderWidth={1} borderRadius="md">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">
                          Crimson Dragons vs Shadow Wolves
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Territory Stakes: 3 dojos
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Diplomatic Implications: High
                        </Text>
                      </VStack>
                      <Badge colorScheme="orange">In Progress</Badge>
                    </HStack>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

const AdvancedMovementPanel: React.FC = () => {
  const [selectedDojo, setSelectedDojo] = useState('dojo-1');
  const toast = useToast();

  const teleportToDojo = async (
    teleportType: 'instant' | 'ritual' | 'clan_gate'
  ) => {
    try {
      const gameMechanics = new GameMechanicsService();
      const movement = await gameMechanics.teleportToDojo(
        selectedDojo,
        teleportType
      );

      toast({
        title: 'Teleportation Started',
        description: `Teleporting to ${movement.toLocation.dojoName} using ${teleportType} method`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to teleport to dojo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fastTravelToDojo = async (
    fastTravelType: 'clan_network' | 'alliance_network' | 'premium'
  ) => {
    try {
      const gameMechanics = new GameMechanicsService();
      const movement = await gameMechanics.fastTravelToDojo(
        selectedDojo,
        fastTravelType
      );

      toast({
        title: 'Fast Travel Started',
        description: `Fast traveling to ${movement.toLocation.dojoName} via ${fastTravelType}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fast travel to dojo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Advanced Movement
      </Heading>

      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={4}>
              Teleportation
            </Heading>
            <Text mb={4}>
              Instant or ritual-based teleportation to any dojo.
            </Text>
            <VStack spacing={3} align="stretch">
              <Button
                colorScheme="purple"
                onClick={() => teleportToDojo('instant')}
              >
                Instant Teleport (High Cost)
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => teleportToDojo('ritual')}
              >
                Ritual Teleport (Medium Cost)
              </Button>
              <Button
                colorScheme="green"
                onClick={() => teleportToDojo('clan_gate')}
              >
                Clan Gate (Low Cost)
              </Button>
            </VStack>
          </Box>
        </GridItem>

        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={4}>
              Fast Travel Networks
            </Heading>
            <Text mb={4}>
              Use clan, alliance, or premium networks for faster travel.
            </Text>
            <VStack spacing={3} align="stretch">
              <Button
                colorScheme="orange"
                onClick={() => fastTravelToDojo('clan_network')}
              >
                Clan Network (10 min)
              </Button>
              <Button
                colorScheme="teal"
                onClick={() => fastTravelToDojo('alliance_network')}
              >
                Alliance Network (15 min)
              </Button>
              <Button
                colorScheme="pink"
                onClick={() => fastTravelToDojo('premium')}
              >
                Premium Network (5 min)
              </Button>
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

const TerritoryAlliancePanel: React.FC = () => {
  const toast = useToast();

  const createAlliance = async () => {
    try {
      const gameMechanics = new GameMechanicsService();
      const alliance = await gameMechanics.createTerritoryAlliance({
        name: 'Brisbane Coalition',
        leaderClanId: 'clan-1',
        memberClans: ['clan-1', 'clan-2', 'clan-3'],
        sharedTerritories: ['dojo-1', 'dojo-2', 'dojo-3', 'dojo-4'],
      });

      toast({
        title: 'Alliance Created',
        description: `Territory alliance "${alliance.name}" created successfully!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create territory alliance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const createTradeAgreement = async () => {
    try {
      const gameMechanics = new GameMechanicsService();
      const agreement = await gameMechanics.createTradeAgreement({
        clan1Id: 'clan-1',
        clan2Id: 'clan-2',
        resourceType: 'dojo_coins',
        amount: 100,
        frequency: 'daily',
        duration: 30,
      });

      toast({
        title: 'Trade Agreement Created',
        description: 'Trade agreement established between clans',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create trade agreement',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Territory Alliances & Diplomacy
      </Heading>

      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={4}>
              Alliances
            </Heading>
            <Text mb={4}>
              Form alliances with other clans for shared territory control.
            </Text>
            <Button colorScheme="blue" onClick={createAlliance} mb={4}>
              Create Alliance
            </Button>

            <Box p={3} borderWidth={1} borderRadius="md" bg="blue.50">
              <Text fontWeight="bold">Brisbane Coalition</Text>
              <Text fontSize="sm">3 member clans • 4 shared territories</Text>
              <Badge colorScheme="green" mt={2}>
                Active
              </Badge>
            </Box>
          </Box>
        </GridItem>

        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={4}>
              Trade Agreements
            </Heading>
            <Text mb={4}>
              Establish trade agreements for resource exchange.
            </Text>
            <Button colorScheme="green" onClick={createTradeAgreement} mb={4}>
              Create Trade Agreement
            </Button>

            <Box p={3} borderWidth={1} borderRadius="md" bg="green.50">
              <Text fontWeight="bold">Daily Coin Exchange</Text>
              <Text fontSize="sm">100 coins daily • 30 days duration</Text>
              <Badge colorScheme="green" mt={2}>
                Active
              </Badge>
            </Box>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

const GameMechanicsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box minH="100vh" bg="gray.50">
      <Box maxW="1200px" mx="auto" py={8}>
        <Heading size="2xl" mb={8} textAlign="center">
          Advanced Game Mechanics Hub
        </Heading>

        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
          <TabsList>
            <Tab>Basic Mechanics</Tab>
            <Tab>Advanced Challenges</Tab>
            <Tab>Advanced Movement</Tab>
            <Tab>Territory Alliances</Tab>
            <Tab>Achievements</Tab>
            <Tab>Match Tracking</Tab>
            <Tab>Game Balance</Tab>
            <Tab>Performance Optimization</Tab>
          </TabsList>

          <TabsPanels>
            <TabPanel>
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <GridItem>
                  <ChallengeCreationPanel />
                </GridItem>
                <GridItem>
                  <TerritoryControlPanel />
                </GridItem>
                <GridItem>
                  <PlayerMovementPanel />
                </GridItem>
              </Grid>
            </TabPanel>

            <TabPanel>
              <AdvancedChallengePanel />
            </TabPanel>

            <TabPanel>
              <AdvancedMovementPanel />
            </TabPanel>

            <TabPanel>
              <TerritoryAlliancePanel />
            </TabPanel>

            <TabPanel>
              <AchievementPanel />
            </TabPanel>

            <TabPanel>
              <RealTimeMatchTracker />
            </TabPanel>

            <TabPanel>
              <GameBalancePanel />
            </TabPanel>

            <TabPanel>
              <PerformanceOptimizationPanel />
            </TabPanel>
          </TabsPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default GameMechanicsPage;
