import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  useToast as useToastChakra,
  Input,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import axios from "axios";

interface Friend {
  username: string;
  status: string;
  created_at: string;
}

export const Friends: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastChakra();

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get("/api/friendships/?status=accepted");
      setFriends(response.data);
    } catch (error) {
      toast({
        title: "Error fetching friends",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get("/api/friendships/?status=pending");
      setPendingRequests(response.data);
    } catch (error) {
      toast({
        title: "Error fetching requests",
        status: "error",
        duration: 3000,
      });
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
      fetchPendingRequests();
    } catch (error) {
      toast({
        title: "Error sending friend request",
        status: "error",
        duration: 3000,
      });
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    try {
      await axios.post(`/api/friendships/${requestId}/accept/`);
      toast({
        title: "Friend request accepted!",
        status: "success",
        duration: 3000,
      });
      fetchFriends();
      fetchPendingRequests();
    } catch (error) {
      toast({
        title: "Error accepting friend request",
        status: "error",
        duration: 3000,
      });
    }
  };

  const FriendCard: React.FC<{ friend: Friend; isPending?: boolean }> = ({
    friend,
    isPending,
  }) => (
    <HStack
      w="100%"
      bg="gray.800"
      p={4}
      borderRadius="md"
      justify="space-between"
    >
      <HStack spacing={4}>
        <Avatar name={friend.username} size="md" />
        <Box>
          <Text fontWeight="bold">{friend.username}</Text>
          <Text fontSize="sm" color="gray.400">
            {new Date(friend.created_at).toLocaleDateString()}
          </Text>
        </Box>
      </HStack>
      <HStack>
        {isPending ? (
          <>
            <Button
              size="sm"
              colorScheme="purple"
              onClick={() => acceptFriendRequest(parseInt(friend.username))}
            >
              Accept
            </Button>
            <Button size="sm" variant="outline">
              Decline
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" colorScheme="purple">
              Message
            </Button>
            <Button size="sm" variant="outline" colorScheme="red">
              Remove
            </Button>
          </>
        )}
      </HStack>
    </HStack>
  );

  return (
    <Box
      bg="gray.900"
      color="white"
      p={6}
      borderRadius="lg"
      maxW="800px"
      mx="auto"
    >
      <Tabs colorScheme="purple">
        <TabList mb={4}>
          <Tab>Friends ({friends.length})</Tab>
          <Tab>
            Requests
            {pendingRequests.length > 0 && (
              <Badge ml={2} colorScheme="purple">
                {pendingRequests.length}
              </Badge>
            )}
          </Tab>
          <Tab>Add Friend</Tab>
        </TabList>

        <TabPanels>
          {/* Friends List */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {friends.map((friend) => (
                <FriendCard key={friend.username} friend={friend} />
              ))}
              {friends.length === 0 && (
                <Text color="gray.400" textAlign="center">
                  No friends yet. Start adding some!
                </Text>
              )}
            </VStack>
          </TabPanel>

          {/* Pending Requests */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {pendingRequests.map((request) => (
                <FriendCard key={request.username} friend={request} isPending />
              ))}
              {pendingRequests.length === 0 && (
                <Text color="gray.400" textAlign="center">
                  No pending friend requests
                </Text>
              )}
            </VStack>
          </TabPanel>

          {/* Add Friend */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search for players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="gray.800"
                  border="none"
                  _focus={{ border: "none" }}
                />
              </InputGroup>
              <Button
                colorScheme="purple"
                isDisabled={!searchQuery.trim()}
                onClick={() => sendFriendRequest(searchQuery.trim())}
              >
                Send Friend Request
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
