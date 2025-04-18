import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Progress,
  Badge,
  Button,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
} from "@chakra-ui/react";
import axios from "axios";

interface UserProfileData {
  username: string;
  bio: string;
  skill_level: number;
  dojo_coins: number;
  stats: {
    total_matches: number;
    wins: number;
    win_rate: number;
  };
}

interface Achievement {
  name: string;
  description: string;
  points: number;
  earned_at: string;
}

export const UserProfile: React.FC<{ username?: string }> = ({ username }) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
    fetchAchievements();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const endpoint = username
        ? `/api/profiles/${username}/`
        : "/api/profiles/me/";
      const response = await axios.get(endpoint);
      setProfile(response.data);
    } catch (error) {
      toast({
        title: "Error fetching profile",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await axios.get("/api/achievements/my_achievements/");
      setAchievements(response.data);
    } catch (error) {
      toast({
        title: "Error fetching achievements",
        status: "error",
        duration: 3000,
      });
    }
  };

  if (isLoading || !profile) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box
      bg="gray.900"
      color="white"
      p={6}
      borderRadius="lg"
      maxW="800px"
      mx="auto"
    >
      {/* Header */}
      <HStack spacing={6} mb={8}>
        <Avatar
          size="2xl"
          name={profile.username}
          src={`/api/profiles/${profile.username}/avatar/`}
        />
        <VStack align="start" spacing={2}>
          <Text fontSize="3xl" fontWeight="bold">
            {profile.username}
          </Text>
          <Badge colorScheme="purple">
            Level {Math.floor(profile.skill_level / 100)}
          </Badge>
          <Text color="gray.400">{profile.bio}</Text>
        </VStack>
      </HStack>

      {/* Stats */}
      <StatGroup bg="gray.800" p={4} borderRadius="md" mb={6}>
        <Stat>
          <StatLabel>Total Matches</StatLabel>
          <StatNumber>{profile.stats.total_matches}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Wins</StatLabel>
          <StatNumber>{profile.stats.wins}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Win Rate</StatLabel>
          <StatNumber>{profile.stats.win_rate.toFixed(1)}%</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Dojo Coins</StatLabel>
          <StatNumber>{profile.dojo_coins}</StatNumber>
        </Stat>
      </StatGroup>

      {/* Level Progress */}
      <Box mb={8}>
        <Text mb={2}>Level Progress</Text>
        <Progress
          value={profile.skill_level % 100}
          colorScheme="purple"
          borderRadius="full"
          bg="gray.700"
        />
        <Text fontSize="sm" color="gray.400" mt={1}>
          {profile.skill_level % 100}/100 XP to next level
        </Text>
      </Box>

      {/* Achievements */}
      <Text fontSize="xl" mb={4}>
        Recent Achievements
      </Text>
      <VStack spacing={4} align="stretch">
        {achievements.map((achievement) => (
          <Box key={achievement.name} bg="gray.800" p={4} borderRadius="md">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">{achievement.name}</Text>
                <Text fontSize="sm" color="gray.400">
                  {achievement.description}
                </Text>
              </VStack>
              <Badge colorScheme="green">+{achievement.points} XP</Badge>
            </HStack>
          </Box>
        ))}
      </VStack>

      {/* Actions */}
      {username && username !== profile.username && (
        <HStack mt={6} spacing={4}>
          <Button colorScheme="purple">Add Friend</Button>
          <Button variant="outline" colorScheme="purple">
            Send Message
          </Button>
        </HStack>
      )}
    </Box>
  );
};
