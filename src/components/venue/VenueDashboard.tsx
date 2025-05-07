import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const VenueDashboard: React.FC = () => {
  return (
    <Box p={4}>
      <Heading mb={4}>Venue Dashboard</Heading>
      <Text>Welcome to the Venue Management Dashboard. More features coming soon!</Text>
      {/* Add sections for managing tables, viewing analytics, etc. */}
    </Box>
  );
};

export default VenueDashboard; 