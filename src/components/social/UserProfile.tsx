import React, { useState, useEffect } from "react";
import {
  Box,
  HStack,
  Text,
  Progress,
  Badge,
  Button,
  Stat,
  Heading
} from "@chakra-ui/react";
import axios from "axios";
import { useToast as useToastChakra } from '@chakra-ui/toast';

interface GameHistoryItem {
  id: string;
  opponent: { username: string; avatar: string };
  outcome: 'Win' | 'Loss' | 'Draw';
  date: string;
}

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
  recent_games?: GameHistoryItem[];
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
  const [recentGames, setRecentGames] = useState<GameHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastChakra();

  useEffect(() => {
    fetchProfile();
    fetchAchievements();
    fetchRecentGames();
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
    } finally {
    }
  };

  const fetchRecentGames = async () => {
    try {
      const endpoint = username
        ? `/api/profiles/${username}/games/recent`
        : "/api/profiles/me/games/recent";
      const response = await axios.get(endpoint);
      setRecentGames(response.data);
    } catch (error) {
      toast({
        title: "Error fetching recent games",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
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
        <Box as="img"
          size="2xl"
          src={`/api/profiles/${profile.username}/avatar/`}
          alt={profile.username}
        />
        <Box display="flex" flexDirection="column" align="start" spacing={2}>
          <Text fontSize="3xl" fontWeight="bold">
            {profile.username}
          </Text>
          <Badge colorScheme="purple">
            Level {Math.floor(profile.skill_level / 100)}
          </Badge>
          <Text color="gray.400">{profile.bio}</Text>
        </Box>
      </HStack>

      {/* Stats */}
      <Box mb={6}>
        <Heading size="md" mb={4}>Stats</Heading>
        <Box display="flex" flexDirection="column" spacing={4} align="stretch">
          <Stat.Root>
            <Stat.Label>Total Matches</Stat.Label>
            <Stat.ValueText>{profile.stats.total_matches}</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>Wins</Stat.Label>
            <Stat.ValueText>{profile.stats.wins}</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>Win Rate</Stat.Label>
            <Stat.ValueText>{profile.stats.win_rate.toFixed(1)}%</Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label>Dojo Coins</Stat.Label>
            <Stat.ValueText>{profile.dojo_coins}</Stat.ValueText>
          </Stat.Root>
        </Box>
      </Box>

      {/* Level Progress */}
      <Box mb={8}>
        <Heading size="md" mb={4}>Level Progress</Heading>
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

      {/* Recent Games Section */}
      <Box mb={8}>
        <Heading size="md" mb={4}>Recent Games</Heading>
        {recentGames.length === 0 ? (
          <Text>No recent games played.</Text>
        ) : (
          <Box display="flex" flexDirection="column" spacing={4} align="stretch">
            {recentGames.map(game => (
              <Box key={game.id} p={3} shadow="md" borderWidth="1px" borderRadius="md">
                <HStack justify="space-between">
                  <HStack>
                    <Box as="img" size="sm" src={game.opponent.avatar} alt={game.opponent.username} />
                    <Text fontWeight="bold">vs {game.opponent.username}</Text>
                  </HStack>
                  <Text>{game.outcome} on {new Date(game.date).toLocaleDateString()}</Text>
                </HStack>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Achievements */}
      <Box mb={8}>
        <Heading size="md" mb={4}>Recent Achievements</Heading>
        <Box display="flex" flexDirection="column" spacing={4} align="stretch">
          {achievements.map((achievement) => (
            <Box key={achievement.name} bg="gray.800" p={4} borderRadius="md">
              <HStack justify="space-between">
                <Box display="flex" flexDirection="column" align="start" spacing={1}>
                  <Text fontWeight="bold">{achievement.name}</Text>
                  <Text fontSize="sm" color="gray.400">
                    {achievement.description}
                  </Text>
                </Box>
                <Badge colorScheme="green">+{achievement.points} XP</Badge>
              </HStack>
            </Box>
          ))}
        </Box>
      </Box>

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

export default UserProfile;
