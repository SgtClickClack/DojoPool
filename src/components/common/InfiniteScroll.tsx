import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    VStack,
    Spinner,
    Text,
    Button,
    useColorModeValue,
    Center
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfiniteScrollProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    error?: Error | null;
    onRetry?: () => void;
    loadingComponent?: React.ReactNode;
    emptyComponent?: React.ReactNode;
    threshold?: number;
    className?: string;
    style?: React.CSSProperties;
}

function InfiniteScroll<T>({
    items,
    renderItem,
    hasMore,
    isLoading,
    onLoadMore,
    error,
    onRetry,
    loadingComponent,
    emptyComponent,
    threshold = 200,
    className,
    style
}: InfiniteScrollProps<T>) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const scrollContainer = useRef<HTMLDivElement>(null);
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.600', 'gray.400');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                setIsIntersecting(entry.isIntersecting);
            },
            {
                root: null,
                rootMargin: `${threshold}px`,
                threshold: 0.1
            }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [threshold]);

    useEffect(() => {
        if (isIntersecting && hasMore && !isLoading && !error) {
            onLoadMore();
        }
    }, [isIntersecting, hasMore, isLoading, error, onLoadMore]);

    const renderLoader = () => {
        if (loadingComponent) {
            return loadingComponent;
        }

        return (
            <Center py={8}>
                <VStack spacing={4}>
                    <Spinner
                        size="xl"
                        color="blue.500"
                        thickness="4px"
                        speed="0.65s"
                        as={motion.div}
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                    <Text color={textColor}>Loading more items...</Text>
                </VStack>
            </Center>
        );
    };

    const renderError = () => (
        <Box
            p={6}
            bg={bgColor}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="lg"
            textAlign="center"
            as={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <VStack spacing={4}>
                <Text color="red.500" fontWeight="bold">
                    {error?.message || 'Error loading items'}
                </Text>
                {onRetry && (
                    <Button
                        colorScheme="blue"
                        onClick={onRetry}
                        as={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Try Again
                    </Button>
                )}
            </VStack>
        </Box>
    );

    const renderEmpty = () => {
        if (emptyComponent) {
            return emptyComponent;
        }

        return (
            <Box
                p={8}
                bg={bgColor}
                borderWidth={1}
                borderColor={borderColor}
                borderRadius="lg"
                textAlign="center"
            >
                <Text color={textColor}>No items to display</Text>
            </Box>
        );
    };

    if (items.length === 0 && !isLoading) {
        return renderEmpty();
    }

    return (
        <Box
            ref={scrollContainer}
            className={className}
            style={style}
            position="relative"
        >
            <AnimatePresence mode="popLayout">
                <VStack spacing={4} align="stretch">
                    {items.map((item, index) => (
                        <Box
                            key={index}
                            as={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                delay: index * 0.05
                            }}
                        >
                            {renderItem(item, index)}
                        </Box>
                    ))}
                </VStack>
            </AnimatePresence>

            {error && renderError()}
            
            <div ref={observerTarget} style={{ height: '1px' }} />
            
            {isLoading && renderLoader()}
            
            {!hasMore && items.length > 0 && (
                <Center py={8}>
                    <Text color={textColor}>
                        No more items to load
                    </Text>
                </Center>
            )}
        </Box>
    );
}

export default InfiniteScroll; 