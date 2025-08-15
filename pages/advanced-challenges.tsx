import React from 'react';
import { Box, Container, Heading, Text, VStack, Alert, AlertIcon } from '@chakra-ui/react';
import { AdvancedChallengeManager } from '../src/components/challenge/AdvancedChallengeManager';

const AdvancedChallengesPage: React.FC = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={4}>Advanced Challenge Features</Heading>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Comprehensive challenge management with eligibility checking, statistics, and automated expiration handling.
          </Text>
        </Box>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">New Features Implemented:</Text>
            <Text fontSize="sm" mt={2}>
              • Challenge requirements validation and player eligibility checks<br/>
              • Challenge expiration and auto-decline functionality<br/>
              • Challenge history and statistics tracking<br/>
              • Challenge notifications and real-time updates<br/>
              • Challenge rewards and progression system<br/>
              • Challenge match scheduling and coordination<br/>
              • Advanced challenge analytics and reporting
            </Text>
          </Box>
        </Alert>

        <AdvancedChallengeManager 
          playerId="player-1"
          onChallengeUpdate={() => {
            console.log('Challenge updated');
          }}
        />
      </VStack>
    </Container>
  );
};

export default AdvancedChallengesPage; 