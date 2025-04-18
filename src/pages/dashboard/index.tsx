import React from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { AuthenticatedLayout } from "../../components/layout/AuthenticatedLayout";

const DashboardPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <Box p={8}>
          <Heading mb={8}>Dashboard</Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Stat
              p={4}
              bg="white"
              rounded="lg"
              shadow="md"
              border="1px"
              borderColor="gray.200"
            >
              <StatLabel>Total Games</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Games played this month</StatHelpText>
            </Stat>

            <Stat
              p={4}
              bg="white"
              rounded="lg"
              shadow="md"
              border="1px"
              borderColor="gray.200"
            >
              <StatLabel>Win Rate</StatLabel>
              <StatNumber>0%</StatNumber>
              <StatHelpText>Last 30 days</StatHelpText>
            </Stat>

            <Stat
              p={4}
              bg="white"
              rounded="lg"
              shadow="md"
              border="1px"
              borderColor="gray.200"
            >
              <StatLabel>Skill Level</StatLabel>
              <StatNumber>Beginner</StatNumber>
              <StatHelpText>Current ranking</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Box mt={8}>
            <Heading size="md" mb={4}>
              Recent Activity
            </Heading>
            <Text color="gray.500">No recent activity to display.</Text>
          </Box>
        </Box>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
