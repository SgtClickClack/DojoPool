import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  IconButton,
  Input,
  Textarea,
  Badge,
  Image,
  Skeleton,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHeart,
  FaComment,
  FaShare,
  FaEllipsisV,
  FaTrophy,
  FaUserPlus,
  FaGamepad,
} from "react-icons/fa";
import { useToast as useToastChakra } from '@chakra-ui/toast';

interface User {
  id: string;
  username: string;
  avatar: string;
  rating: number;
}

interface FeedItem {
  id: string;
  type: "achievement" | "game" | "tournament" | "social";
  user: User;
  content: string;
  media?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked_by_user: boolean;
  metadata?: {
    achievement?: {
      name: string;
      rarity: string;
      icon: string;
    };
    game?: {
      opponent: User;
      score: string;
      highlights?: string[];
    };
    tournament?: {
      name: string;
      placement: number;
      prize?: number;
    };
  };
}

interface FriendSuggestion {
  user: User;
  mutual_friends: number;
  mutual_achievements: number;
  recent_games: number;
}

const SocialFeed: React.FC = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const toast = useToastChakra();

  const bgColor = "white";
  const borderColor = "gray.200";
  const textColor = "gray.600";

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/social/feed/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_post") {
        addNewPost(data.post);
      } else if (data.type === "update_post") {
        updatePost(data.post);
      }
    };

    // Fetch initial data
    fetchFeed();
    fetchSuggestions();

    return () => ws.close();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await fetch("/api/social/feed");
      const data = await response.json();
      setFeed(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast({
        title: "Error loading feed",
        status: "error",
        duration: 5000,
      });
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/social/suggestions");
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const addNewPost = (post: FeedItem) => {
    setFeed((prev) => [post, ...prev]);
  };

  const updatePost = (updatedPost: FeedItem) => {
    setFeed((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      updatePost(data);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment }),
      });
      const data = await response.json();
      updatePost(data);
    } catch (error) {
      console.error("Error commenting:", error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/share`, {
        method: "POST",
      });
      const data = await response.json();
      toast({
        title: "Post shared successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      const response = await fetch(`/api/social/friends/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      toast({
        title: "Friend request sent",
        status: "success",
        duration: 3000,
      });
      // Remove from suggestions
      setSuggestions((prev) => prev.filter((s) => s.user.id !== userId));
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const renderFeedItem = (item: FeedItem) => {
    return (
      <Box
        key={item.id}
        p={4}
        bg={bgColor}
        borderRadius="lg"
        borderWidth={1}
        borderColor={borderColor}
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        mb={4}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Flex>
            <Box as="img"
              src={item.user.avatar}
              alt={item.user.username}
              w="40px"
              h="40px"
              borderRadius="full"
              mr={2}
            />
            <Box display="flex" flexDirection="column">
              <Text fontWeight="bold">{item.user.username}</Text>
              <Text fontSize="sm" color={textColor}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </Box>
          </Flex>

          <Box>
            <IconButton
              icon={<FaEllipsisV />}
              variant="ghost"
              aria-label="Options"
            />
          </Box>
        </Flex>

        {item.type === "achievement" && item.metadata?.achievement && (
          <Box
            p={3}
            bg="gray.50"
            borderRadius="md"
            mb={4}
          >
            <Flex>
              <Box as="img"
                src={item.metadata.achievement.icon}
                alt={item.metadata.achievement.name}
                w="40px"
                h="40px"
                objectFit="cover"
                borderRadius="md"
                mr={2}
              />
              <Box display="flex" flexDirection="column">
                <Text fontWeight="bold">{item.metadata.achievement.name}</Text>
                <Badge
                  colorScheme={
                    item.metadata.achievement.rarity === "legendary"
                      ? "purple"
                      : item.metadata.achievement.rarity === "epic"
                        ? "pink"
                        : item.metadata.achievement.rarity === "rare"
                          ? "blue"
                          : "gray"
                  }
                >
                  {item.metadata.achievement.rarity}
                </Badge>
              </Box>
            </Flex>
          </Box>
        )}

        {item.type === "game" && item.metadata?.game && (
          <Box
            p={3}
            bg="gray.50"
            borderRadius="md"
            mb={4}
          >
            <Flex justify="space-between" mb={2}>
              <Text fontWeight="bold">
                vs {item.metadata.game.opponent.username}
              </Text>
              <Badge
                colorScheme={
                  item.metadata.game.score.split("-")[0] >
                  item.metadata.game.score.split("-")[1]
                    ? "green"
                    : "red"
                }
              >
                {item.metadata.game.score}
              </Badge>
            </Flex>
            {item.metadata.game.highlights && (
              <Flex overflowX="auto" py={2}>
                {item.metadata.game.highlights.map((highlight, i) => (
                  <Box
                    key={i}
                    as="img"
                    src={highlight}
                    alt={`Highlight ${i + 1}`}
                    w="100px"
                    h="100px"
                    objectFit="cover"
                    borderRadius="md"
                    cursor="pointer"
                    mr={2}
                  />
                ))}
              </Flex>
            )}
          </Box>
        )}

        <Text mb={4}>{item.content}</Text>

        {item.media && (
          <Box as="img"
            src={item.media}
            alt={`Media for post ${item.id}`}
            maxH="400px"
            w="100%"
            objectFit="cover"
            borderRadius="md"
            mb={4}
          />
        )}

        <Flex spacing={4}>
          <Button
            leftIcon={<FaHeart />}
            variant={item.liked_by_user ? "solid" : "ghost"}
            colorScheme="red"
            size="sm"
            onClick={() => handleLike(item.id)}
          >
            {item.likes}
          </Button>

          <Button leftIcon={<FaComment />} variant="ghost" size="sm">
            {item.comments}
          </Button>

          <Button
            leftIcon={<FaShare />}
            variant="ghost"
            size="sm"
            onClick={() => handleShare(item.id)}
          >
            Share
          </Button>
        </Flex>
      </Box>
    );
  };

  const renderSuggestions = () => {
    return (
      <Box
        position="sticky"
        top={4}
        p={4}
        bg={bgColor}
        borderRadius="lg"
        borderWidth={1}
        borderColor={borderColor}
      >
        <Text fontWeight="bold" mb={4}>
          Suggested Friends
        </Text>

        <Box>
          {suggestions.map((suggestion) => (
            <Flex key={suggestion.user.id} w="100%" justify="space-between">
              <Flex>
                <Box as="img"
                  src={suggestion.user.avatar}
                  alt={suggestion.user.username}
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  mr={2}
                />
                <Box display="flex" flexDirection="column">
                  <Text fontWeight="medium">{suggestion.user.username}</Text>
                  <Text fontSize="xs" color={textColor}>
                    {suggestion.mutual_friends} mutual friends
                  </Text>
                </Box>
              </Flex>

              <Button
                leftIcon={<FaUserPlus />}
                size="sm"
                colorScheme="blue"
                onClick={() => handleAddFriend(suggestion.user.id)}
              >
                Add
              </Button>
            </Flex>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Flex p={4} gap={8}>
      {/* Main Feed */}
      <Box flex={1} spacing={4} ref={feedRef}>
        {/* New Post Input */}
        <Box
          w="100%"
          p={4}
          bg={bgColor}
          borderRadius="lg"
          borderWidth={1}
          borderColor={borderColor}
        >
          <Textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            mb={4}
          />
          <Button colorScheme="blue" isDisabled={!newPost.trim()}>
            Post
          </Button>
        </Box>

        {/* Feed Items */}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Box
              key={i}
              p={4}
              bg={bgColor}
              borderRadius="lg"
              borderWidth={1}
              borderColor={borderColor}
              w="100%"
            >
              <Flex mb={4}>
                <Skeleton height="40px" width="40px" borderRadius="full" />
                <Box flex={1}>
                  <Skeleton height="20px" width="150px" />
                  <Skeleton height="16px" width="100px" />
                </Box>
              </Flex>
              <Skeleton height="100px" mb={4} />
              <Flex>
                <Skeleton height="30px" width="80px" />
                <Skeleton height="30px" width="80px" />
                <Skeleton height="30px" width="80px" />
              </Flex>
            </Box>
          ))
        ) : (
          <AnimatePresence>{feed.map(renderFeedItem)}</AnimatePresence>
        )}
      </Box>

      {/* Suggestions Sidebar */}
      <Box w="300px">{renderSuggestions()}</Box>
    </Flex>
  );
};

export default SocialFeed;
