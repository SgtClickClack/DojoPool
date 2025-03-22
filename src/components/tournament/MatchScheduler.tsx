import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FaCalendar, FaClock, FaUser, FaEdit } from 'react-icons/fa';
import { format, addMinutes, parseISO } from 'date-fns';

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player;
  player2: Player;
  status: 'scheduled' | 'in_progress' | 'completed';
  startTime?: string;
  endTime?: string;
  duration: number; // in minutes
  tableNumber?: number;
}

interface Player {
  id: string;
  name: string;
  availability?: string[];
}

interface MatchSchedulerProps {
  tournamentId: string;
  matches: Match[];
  tables: number[];
  onScheduleUpdate: (matchId: string, updates: Partial<Match>) => Promise<void>;
  isAdmin?: boolean;
}

export const MatchScheduler: React.FC<MatchSchedulerProps> = ({
  tournamentId,
  matches,
  tables,
  onScheduleUpdate,
  isAdmin = false,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Colors based on theme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const scheduledColor = useColorModeValue('gray.500', 'gray.300');

  const handleScheduleClick = (match: Match) => {
    setSelectedMatch(match);
    if (match.startTime) {
      setStartTime(match.startTime);
    }
    if (match.duration) {
      setDuration(match.duration);
    }
    if (match.tableNumber) {
      setTableNumber(match.tableNumber);
    }
    onOpen();
  };

  const handleScheduleSubmit = async () => {
    if (!selectedMatch) return;

    setIsLoading(true);
    try {
      const updates = {
        startTime,
        duration,
        tableNumber,
        status: 'scheduled' as const,
      };

      await onScheduleUpdate(selectedMatch.id, updates);
      toast({
        title: 'Match scheduled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to schedule match',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMatchCard = (match: Match) => {
    const isScheduled = match.status === 'scheduled';
    const isInProgress = match.status === 'in_progress';
    const isCompleted = match.status === 'completed';

    return (
      <Box
        key={match.id}
        p={4}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
      >
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontWeight="bold">Match {match.matchNumber}</Text>
            <Button
              size="sm"
              leftIcon={<FaEdit />}
              onClick={() => handleScheduleClick(match)}
              isDisabled={!isAdmin || isCompleted}
            >
              {isScheduled ? 'Reschedule' : 'Schedule'}
            </Button>
          </HStack>

          <HStack spacing={2}>
            <FaUser />
            <Text>{match.player1.name}</Text>
          </HStack>

          <HStack spacing={2}>
            <FaUser />
            <Text>{match.player2.name}</Text>
          </HStack>

          {isScheduled && match.startTime && (
            <HStack spacing={2}>
              <FaCalendar />
              <Text>Start: {format(parseISO(match.startTime), 'PPp')}</Text>
            </HStack>
          )}

          {isScheduled && match.duration && (
            <HStack spacing={2}>
              <FaClock />
              <Text>Duration: {match.duration} minutes</Text>
            </HStack>
          )}

          {isScheduled && match.tableNumber && (
            <Text>Table: {match.tableNumber}</Text>
          )}

          {isInProgress && (
            <Text color={activeColor}>In Progress</Text>
          )}

          {isCompleted && match.endTime && (
            <HStack spacing={2}>
              <FaClock />
              <Text>Completed: {format(parseISO(match.endTime), 'PPp')}</Text>
            </HStack>
          )}
        </VStack>
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
          Match Schedule
        </Text>
        <VStack spacing={4} align="stretch">
          {matches.map(renderMatchCard)}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule Match</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Start Time</FormLabel>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <FormErrorMessage>Start time is required</FormErrorMessage>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Duration (minutes)</FormLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                </Select>
                <FormErrorMessage>Duration is required</FormErrorMessage>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Table Number</FormLabel>
                <Select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(Number(e.target.value))}
                >
                  {tables.map((table) => (
                    <option key={table} value={table}>
                      Table {table}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>Table number is required</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleScheduleSubmit}
              isLoading={isLoading}
              isDisabled={!startTime}
            >
              Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}; 