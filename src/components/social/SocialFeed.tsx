import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Avatar,
    Button,
    IconButton,
    Input,
    Textarea,
    useColorModeValue,
    Divider,
    Badge,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    Image,
    Skeleton
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHeart,
    FaComment,
    FaShare,
    FaEllipsisV,
    FaTrophy,
    FaUserPlus,
    FaGamepad
} from 'react-icons/fa';

interface User {
    id: string;
    username: string;
    avatar: string;
    rating: number;
}

interface FeedItem {
    id: string;
    type: 'achievement' | 'game' | 'tournament' | 'social';
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
    const [newPost, setNewPost] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const feedRef = useRef<HTMLDivElement>(null);
    const toast = useToast();
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    useEffect(() => {
        // Connect to WebSocket for real-time updates
        const ws = new WebSocket(
            `${process.env.REACT_APP_WS_URL}/social/feed/`
        );
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'new_post') {
                addNewPost(data.post);
            } else if (data.type === 'update_post') {
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
            const response = await fetch('/api/social/feed');
            const data = await response.json();
            setFeed(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching feed:', error);
            toast({
                title: 'Error loading feed',
                status: 'error',
                duration: 5000
            });
        }
    };

    const fetchSuggestions = async () => {
        try {
            const response = await fetch('/api/social/suggestions');
            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const addNewPost = (post: FeedItem) => {
        setFeed(prev => [post, ...prev]);
    };

    const updatePost = (updatedPost: FeedItem) => {
        setFeed(prev =>
            prev.map(post =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
    };

    const handleLike = async (postId: string) => {
        try {
            const response = await fetch(`/api/social/posts/${postId}/like`, {
                method: 'POST'
            });
            const data = await response.json();
            updatePost(data);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleComment = async (postId: string, comment: string) => {
        try {
            const response = await fetch(`/api/social/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: comment })
            });
            const data = await response.json();
            updatePost(data);
        } catch (error) {
            console.error('Error commenting:', error);
        }
    };

    const handleShare = async (postId: string) => {
        try {
            const response = await fetch(`/api/social/posts/${postId}/share`, {
                method: 'POST'
            });
            const data = await response.json();
            toast({
                title: 'Post shared successfully',
                status: 'success',
                duration: 3000
            });
        } catch (error) {
            console.error('Error sharing post:', error);
        }
    };

    const handleAddFriend = async (userId: string) => {
        try {
            const response = await fetch(`/api/social/friends/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await response.json();
            toast({
                title: 'Friend request sent',
                status: 'success',
                duration: 3000
            });
            // Remove from suggestions
            setSuggestions(prev =>
                prev.filter(s => s.user.id !== userId)
            );
        } catch (error) {
            console.error('Error adding friend:', error);
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
                    <HStack>
                        <Avatar
                            size="md"
                            src={item.user.avatar}
                            name={item.user.username}
                        />
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">
                                {item.user.username}
                            </Text>
                            <Text fontSize="sm" color={textColor}>
                                {new Date(item.timestamp).toLocaleString()}
                            </Text>
                        </VStack>
                    </HStack>
                    
                    <Menu>
                        <MenuButton
                            as={IconButton}
                            icon={<FaEllipsisV />}
                            variant="ghost"
                            aria-label="Options"
                        />
                        <MenuList>
                            <MenuItem>Report</MenuItem>
                            <MenuItem>Mute</MenuItem>
                            <MenuItem>Hide</MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>
                
                {item.type === 'achievement' && item.metadata?.achievement && (
                    <HStack
                        p={3}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="md"
                        mb={4}
                    >
                        <Image
                            src={item.metadata.achievement.icon}
                            boxSize="40px"
                            objectFit="cover"
                            borderRadius="md"
                        />
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">
                                {item.metadata.achievement.name}
                            </Text>
                            <Badge colorScheme={
                                item.metadata.achievement.rarity === 'legendary' ? 'purple' :
                                item.metadata.achievement.rarity === 'epic' ? 'pink' :
                                item.metadata.achievement.rarity === 'rare' ? 'blue' :
                                'gray'
                            }>
                                {item.metadata.achievement.rarity}
                            </Badge>
                        </VStack>
                    </HStack>
                )}
                
                {item.type === 'game' && item.metadata?.game && (
                    <Box
                        p={3}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="md"
                        mb={4}
                    >
                        <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold">
                                vs {item.metadata.game.opponent.username}
                            </Text>
                            <Badge colorScheme={
                                item.metadata.game.score.split('-')[0] >
                                item.metadata.game.score.split('-')[1]
                                    ? 'green'
                                    : 'red'
                            }>
                                {item.metadata.game.score}
                            </Badge>
                        </HStack>
                        {item.metadata.game.highlights && (
                            <HStack overflowX="auto" py={2}>
                                {item.metadata.game.highlights.map((highlight, i) => (
                                    <Image
                                        key={i}
                                        src={highlight}
                                        boxSize="100px"
                                        objectFit="cover"
                                        borderRadius="md"
                                        cursor="pointer"
                                    />
                                ))}
                            </HStack>
                        )}
                    </Box>
                )}
                
                <Text mb={4}>{item.content}</Text>
                
                {item.media && (
                    <Image
                        src={item.media}
                        maxH="400px"
                        w="100%"
                        objectFit="cover"
                        borderRadius="md"
                        mb={4}
                    />
                )}
                
                <HStack spacing={4}>
                    <Button
                        leftIcon={<FaHeart />}
                        variant={item.liked_by_user ? 'solid' : 'ghost'}
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleLike(item.id)}
                    >
                        {item.likes}
                    </Button>
                    
                    <Button
                        leftIcon={<FaComment />}
                        variant="ghost"
                        size="sm"
                    >
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
                </HStack>
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
                
                <VStack spacing={4}>
                    {suggestions.map(suggestion => (
                        <HStack
                            key={suggestion.user.id}
                            w="100%"
                            justify="space-between"
                        >
                            <HStack>
                                <Avatar
                                    size="sm"
                                    src={suggestion.user.avatar}
                                    name={suggestion.user.username}
                                />
                                <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium">
                                        {suggestion.user.username}
                                    </Text>
                                    <Text fontSize="xs" color={textColor}>
                                        {suggestion.mutual_friends} mutual friends
                                    </Text>
                                </VStack>
                            </HStack>
                            
                            <Button
                                leftIcon={<FaUserPlus />}
                                size="sm"
                                colorScheme="blue"
                                onClick={() => handleAddFriend(suggestion.user.id)}
                            >
                                Add
                            </Button>
                        </HStack>
                    ))}
                </VStack>
            </Box>
        );
    };

    return (
        <Flex p={4} gap={8}>
            {/* Main Feed */}
            <VStack flex={1} spacing={4} ref={feedRef}>
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
                    <Button
                        colorScheme="blue"
                        isDisabled={!newPost.trim()}
                    >
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
                            <HStack mb={4}>
                                <Skeleton height="40px" width="40px" borderRadius="full" />
                                <VStack align="start" flex={1}>
                                    <Skeleton height="20px" width="150px" />
                                    <Skeleton height="16px" width="100px" />
                                </VStack>
                            </HStack>
                            <Skeleton height="100px" mb={4} />
                            <HStack>
                                <Skeleton height="30px" width="80px" />
                                <Skeleton height="30px" width="80px" />
                                <Skeleton height="30px" width="80px" />
                            </HStack>
                        </Box>
                    ))
                ) : (
                    <AnimatePresence>
                        {feed.map(renderFeedItem)}
                    </AnimatePresence>
                )}
            </VStack>
            
            {/* Suggestions Sidebar */}
            <Box w="300px">
                {renderSuggestions()}
            </Box>
        </Flex>
    );
};

export default SocialFeed; 