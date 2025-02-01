import React, { Component, ErrorInfo } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Button,
    Icon,
    useColorModeValue,
    Code,
    Collapse,
    useDisclosure
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo
        });

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log error to your error reporting service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
        }

        return this.props.children;
    }
}

interface ErrorFallbackProps {
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo }) => {
    const { isOpen, onToggle } = useDisclosure();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('red.500', 'red.300');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <Box
            as={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            p={8}
            bg={bgColor}
            borderWidth={2}
            borderColor={borderColor}
            borderRadius="lg"
            maxW="600px"
            mx="auto"
            my={8}
        >
            <VStack spacing={6} align="stretch">
                <VStack spacing={2} align="center">
                    <Icon
                        as={FaExclamationTriangle}
                        w={12}
                        h={12}
                        color="red.500"
                        as={motion.svg}
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <Heading size="lg" textAlign="center">
                        Oops! Something went wrong
                    </Heading>
                    <Text color={textColor} textAlign="center">
                        Don't worry, we're on it. In the meantime, you can:
                    </Text>
                </VStack>

                <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleRefresh}
                    as={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Refresh the page
                </Button>

                {(error || errorInfo) && (
                    <Box>
                        <Button
                            variant="ghost"
                            rightIcon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
                            onClick={onToggle}
                            width="100%"
                            justifyContent="space-between"
                        >
                            Technical Details
                        </Button>
                        <Collapse in={isOpen}>
                            <VStack spacing={4} mt={4} align="stretch">
                                {error && (
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>
                                            Error:
                                        </Text>
                                        <Code p={4} borderRadius="md" width="100%">
                                            {error.toString()}
                                        </Code>
                                    </Box>
                                )}
                                {errorInfo && (
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>
                                            Component Stack:
                                        </Text>
                                        <Code p={4} borderRadius="md" width="100%" whiteSpace="pre-wrap">
                                            {errorInfo.componentStack}
                                        </Code>
                                    </Box>
                                )}
                            </VStack>
                        </Collapse>
                    </Box>
                )}

                <Text fontSize="sm" color={textColor} textAlign="center">
                    If the problem persists, please contact support.
                </Text>
            </VStack>
        </Box>
    );
};

export default ErrorBoundary; 