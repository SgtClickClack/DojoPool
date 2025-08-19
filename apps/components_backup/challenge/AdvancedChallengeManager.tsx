import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  FireIcon,
} from '@chakra-ui/icons';
import {
  ChallengeService,
  type Challenge,
  type ChallengeStats,
  PlayerEligibility,
} from '../../services/ChallengeService';

interface AdvancedChallengeManagerProps {
  playerId?: string;
  onChallengeUpdate?: () => void;
}

export const AdvancedChallengeManager: React.FC<
  AdvancedChallengeManagerProps
> = ({ playerId = 'player-1', onChallengeUpdate }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<Record<string, any>>(
    {}
  );
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const challengeTypes = ['pilgrimage', 'gauntlet', 'duel', 'clan_war'];

  useEffect(() => {
    loadChallenges();
    loadStats();
  }, [playerId]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const activeChallenges = await ChallengeService.getActiveChallenges();
      setChallenges(activeChallenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const challengeStats = await ChallengeService.getChallengeStats(playerId);
      setStats(challengeStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkEligibility = async (challengeType: string) => {
    try {
      const eligibility = await ChallengeService.checkEligibility(
        playerId,
        challengeType
      );
      setEligibilityData((prev) => ({
        ...prev,
        [challengeType]: eligibility,
      }));
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const handleChallengeResponse = async (
    challengeId: string,
    response: 'accept' | 'decline'
  ) => {
    setLoading(true);
    try {
      await ChallengeService.respondToChallenge(challengeId, response);
      toast({
        title: 'Success',
        description: `Challenge ${response}ed successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadChallenges();
      onChallengeUpdate?.();
    } catch (error) {
      console.error('Error responding to challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to respond to challenge',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpiredChallenges = async () => {
    try {
      const result = await ChallengeService.cleanupExpiredChallenges();
      toast({
        title: 'Cleanup Complete',
        description: `Cleaned up ${result.cleanedCount} expired challenges`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadChallenges();
    } catch (error) {
      console.error('Error cleaning up challenges:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup expired challenges',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'accepted':
        return 'green';
      case 'declined':
        return 'red';
      case 'completed':
        return 'blue';
      case 'expired':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon />;
      case 'accepted':
        return <CheckCircleIcon />;
      case 'declined':
        return <XCircleIcon />;
      case 'completed':
        return <TrophyIcon />;
      case 'expired':
        return <ExclamationTriangleIcon />;
      default:
        return <ClockIcon />;
    }
  };

  const renderEligibilityAlert = (challengeType: string) => {
    const eligibility = eligibilityData[challengeType];
    if (!eligibility) return null;

    if (eligibility.eligibility.isEligible) {
      return (
        <Alert status="success" borderRadius="md" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>
              Eligible for{' '}
              {ChallengeService.getChallengeTypeName(challengeType)}
            </AlertTitle>
            <AlertDescription>
              You meet all requirements for this challenge type.
            </AlertDescription>
          </Box>
        </Alert>
      );
    } else {
      return (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>
              Not eligible for{' '}
              {ChallengeService.getChallengeTypeName(challengeType)}
            </AlertTitle>
            <AlertDescription>
              {eligibility.eligibility.reasons.join(', ')}
            </AlertDescription>
          </Box>
        </Alert>
      );
    }
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const isExpired = ChallengeService.isChallengeExpired(challenge);
    const timeRemaining = ChallengeService.getTimeUntilExpiration(challenge);

    return (
      <Card
        key={challenge.id}
        mb={4}
        borderColor={isExpired ? 'red.200' : undefined}
      >
        <CardHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <HStack>
                <Badge colorScheme={getStatusColor(challenge.status)}>
                  {ChallengeService.formatChallengeStatus(challenge.status)}
                </Badge>
                <Badge colorScheme="purple">
                  {ChallengeService.getChallengeTypeName(challenge.type)}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {challenge.challengerId === playerId
                  ? 'You challenged'
                  : 'You were challenged by'}{' '}
                {challenge.challengerId === playerId
                  ? challenge.defenderId
                  : challenge.challengerId}
              </Text>
            </VStack>
            <IconButton
              aria-label="View details"
              icon={<ChartBarIcon />}
              size="sm"
              onClick={() => {
                setSelectedChallenge(challenge);
                onOpen();
              }}
            />
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="start" spacing={3}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm">
                Created: {new Date(challenge.createdAt).toLocaleDateString()}
              </Text>
              {challenge.expiresAt && (
                <Text fontSize="sm" color={isExpired ? 'red.500' : 'gray.500'}>
                  {ChallengeService.formatTimeRemaining(timeRemaining)}
                </Text>
              )}
            </HStack>

            {challenge.status === 'pending' &&
              challenge.defenderId === playerId && (
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<CheckCircleIcon />}
                    onClick={() =>
                      handleChallengeResponse(challenge.id, 'accept')
                    }
                    isLoading={loading}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    leftIcon={<XCircleIcon />}
                    onClick={() =>
                      handleChallengeResponse(challenge.id, 'decline')
                    }
                    isLoading={loading}
                  >
                    Decline
                  </Button>
                </HStack>
              )}

            {challenge.eligibility && (
              <Box w="full">
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Requirements:
                </Text>
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text>Level: {challenge.requirements.minLevel}+</Text>
                  <Text>Wins: {challenge.requirements.minWins}+</Text>
                  <Text>
                    Top Ten Defeats: {challenge.requirements.minTopTenDefeats}+
                  </Text>
                  <Text>
                    Master Defeats: {challenge.requirements.minMasterDefeats}+
                  </Text>
                  {challenge.requirements.requiredClanMembership && (
                    <Text>
                      Clan: {challenge.requirements.requiredClanMembership}
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Advanced Challenge Manager
          </Heading>
          <Text color="gray.600">
            Manage challenges, check eligibility, and view statistics
          </Text>
        </Box>

        {/* Statistics */}
        {stats && (
          <Card>
            <CardHeader>
              <Heading size="md">Challenge Statistics</Heading>
            </CardHeader>
            <CardBody>
              <Grid
                templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                gap={4}
              >
                <Stat>
                  <StatLabel>Total Challenges</StatLabel>
                  <StatNumber>{stats.totalChallenges}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Pending</StatLabel>
                  <StatNumber color="yellow.500">
                    {stats.pendingChallenges}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Accepted</StatLabel>
                  <StatNumber color="green.500">
                    {stats.acceptedChallenges}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Completed</StatLabel>
                  <StatNumber color="blue.500">
                    {stats.completedChallenges}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Expired</StatLabel>
                  <StatNumber color="gray.500">
                    {stats.expiredChallenges}
                  </StatNumber>
                </Stat>
              </Grid>

              {stats.challengesByType &&
                Object.keys(stats.challengesByType).length > 0 && (
                  <Box mt={4}>
                    <Text fontWeight="bold" mb={2}>
                      Challenges by Type:
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {Object.entries(stats.challengesByType).map(
                        ([type, count]) => (
                          <Badge key={type} colorScheme="purple">
                            {ChallengeService.getChallengeTypeName(type)}:{' '}
                            {count}
                          </Badge>
                        )
                      )}
                    </HStack>
                  </Box>
                )}
            </CardBody>
          </Card>
        )}

        {/* Eligibility Checker */}
        <Card>
          <CardHeader>
            <Heading size="md">Challenge Eligibility Checker</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <HStack spacing={4} flexWrap="wrap">
                {challengeTypes.map((type) => (
                  <Button
                    key={type}
                    onClick={() => checkEligibility(type)}
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<UserGroupIcon />}
                  >
                    Check {ChallengeService.getChallengeTypeName(type)}
                  </Button>
                ))}
              </HStack>

              {Object.keys(eligibilityData).map((type) =>
                renderEligibilityAlert(type)
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Active Challenges */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Active Challenges</Heading>
              <Button
                size="sm"
                colorScheme="orange"
                onClick={cleanupExpiredChallenges}
                leftIcon={<FireIcon />}
              >
                Cleanup Expired
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Text>Loading challenges...</Text>
            ) : challenges.length === 0 ? (
              <Text color="gray.500">No active challenges found.</Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {challenges.map(renderChallengeCard)}
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Challenge Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Challenge Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedChallenge && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Challenge ID:</Text>
                  <Text fontSize="sm" color="gray.600">
                    {selectedChallenge.id}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Type:</Text>
                  <Badge colorScheme="purple">
                    {ChallengeService.getChallengeTypeName(
                      selectedChallenge.type
                    )}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={getStatusColor(selectedChallenge.status)}>
                    {ChallengeService.formatChallengeStatus(
                      selectedChallenge.status
                    )}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold">Participants:</Text>
                  <Text fontSize="sm">
                    Challenger: {selectedChallenge.challengerId}
                  </Text>
                  <Text fontSize="sm">
                    Defender: {selectedChallenge.defenderId}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Timeline:</Text>
                  <Text fontSize="sm">
                    Created:{' '}
                    {new Date(selectedChallenge.createdAt).toLocaleString()}
                  </Text>
                  {selectedChallenge.acceptedAt && (
                    <Text fontSize="sm">
                      Accepted:{' '}
                      {new Date(selectedChallenge.acceptedAt).toLocaleString()}
                    </Text>
                  )}
                  {selectedChallenge.declinedAt && (
                    <Text fontSize="sm">
                      Declined:{' '}
                      {new Date(selectedChallenge.declinedAt).toLocaleString()}
                    </Text>
                  )}
                  {selectedChallenge.expiresAt && (
                    <Text fontSize="sm">
                      Expires:{' '}
                      {new Date(selectedChallenge.expiresAt).toLocaleString()}
                    </Text>
                  )}
                </Box>

                {selectedChallenge.requirements && (
                  <Box>
                    <Text fontWeight="bold">Requirements:</Text>
                    <VStack align="start" spacing={1} fontSize="sm">
                      <Text>
                        Min Level: {selectedChallenge.requirements.minLevel}
                      </Text>
                      <Text>
                        Min Wins: {selectedChallenge.requirements.minWins}
                      </Text>
                      <Text>
                        Min Top Ten Defeats:{' '}
                        {selectedChallenge.requirements.minTopTenDefeats}
                      </Text>
                      <Text>
                        Min Master Defeats:{' '}
                        {selectedChallenge.requirements.minMasterDefeats}
                      </Text>
                      <Text>
                        Max Active Challenges:{' '}
                        {selectedChallenge.requirements.maxActiveChallenges}
                      </Text>
                      <Text>
                        Cooldown Period:{' '}
                        {Math.round(
                          selectedChallenge.requirements.cooldownPeriod /
                            (1000 * 60 * 60)
                        )}{' '}
                        hours
                      </Text>
                      {selectedChallenge.requirements
                        .requiredClanMembership && (
                        <Text>
                          Required Clan:{' '}
                          {
                            selectedChallenge.requirements
                              .requiredClanMembership
                          }
                        </Text>
                      )}
                      {selectedChallenge.requirements
                        .requiredTerritoryControl && (
                        <Text>Territory Control Required: Yes</Text>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
