import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  useToast as useToastChakra,
  Skeleton,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { StarIcon, PeopleIcon } from "@chakra-ui/icons";
import axios from "axios";

interface FriendSuggestion {
  username: string;
  mutual_friends: number;
  shared_achievements: number;
  score: number;
}

export const FriendSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastChakra();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get("/api/friendships/suggestions/");
      setSuggestions(response.data);
    } catch (error) {
      toast({
        title: "Error fetching suggestions",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (username: string) => {
    try {
      await axios.post("/api/friendships/send_request/", { username });
      toast({
        title: "Friend request sent!",
        status: "success",
        duration: 3000,
      });
      // Remove from suggestions
      setSuggestions(suggestions.filter((s) => s.username !== username));
    } catch (error) {
      toast({
        title: "Error sending friend request",
        status: "error",
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height="80px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Suggested Friends
      </Text>

      {suggestions.length === 0 ? (
        <Text color="gray.400" textAlign="center">
          No suggestions available at the moment
        </Text>
      ) : (
        suggestions.map((suggestion) => (
          <Box
            key={suggestion.username}
            p={4}
            bg="gray.800"
            borderRadius="lg"
            borderWidth={1}
            borderColor="purple.500"
            _hover={{ borderColor: "purple.400" }}
          >
            <HStack justify="space-between">
              <HStack spacing={4}>
                <Avatar name={suggestion.username} size="md" />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{suggestion.username}</Text>
                  <HStack spacing={2}>
                    {suggestion.mutual_friends > 0 && (
                      <Tooltip
                        label={`${suggestion.mutual_friends} mutual friends`}
                      >
                        <Badge colorScheme="purple">
                          <HStack spacing={1}>
                            <PeopleIcon />
                            <Text>{suggestion.mutual_friends}</Text>
                          </HStack>
                        </Badge>
                      </Tooltip>
                    )}
                    {suggestion.shared_achievements > 0 && (
                      <Tooltip
                        label={`${suggestion.shared_achievements} shared achievements`}
                      >
                        <Badge colorScheme="yellow">
                          <HStack spacing={1}>
                            <StarIcon />
                            <Text>{suggestion.shared_achievements}</Text>
                          </HStack>
                        </Badge>
                      </Tooltip>
                    )}
                  </HStack>
                </VStack>
              </HStack>
              <Button
                colorScheme="purple"
                size="sm"
                onClick={() => sendFriendRequest(suggestion.username)}
              >
                Add Friend
              </Button>
            </HStack>
          </Box>
        ))
      )}
    </VStack>
  );
};
