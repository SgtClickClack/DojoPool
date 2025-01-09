import React, { useState, useEffect, useCallback, useRef } from 'react';
import lottie from 'lottie-web';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Avatar, Box, CircularProgress, IconButton, Menu, MenuItem } from '@mui/material';
import { PlayArrow, Pause, Loop, Stop } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface AnimationConfig {
    name: string;
    duration: number;
    frameRate: number;
    loop: boolean;
    trigger: 'hover' | 'click' | 'auto';
}

interface AnimatedAvatarProps {
    userId: number;
    size?: number;
    defaultAnimation?: string;
    onAnimationComplete?: () => void;
    className?: string;
}

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    position: 'relative',
    cursor: 'pointer',
    '&:hover .controls': {
        opacity: 1,
    },
}));

const Controls = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out',
    padding: theme.spacing(0.5),
}));

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
    userId,
    size = 128,
    defaultAnimation,
    onAnimationComplete,
    className,
}) => {
    const avatarRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<any>(null);
    const [currentAnimation, setCurrentAnimation] = useState<string | null>(defaultAnimation || null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // Fetch available animations
    const { data: animations, isLoading: loadingAnimations } = useQuery<AnimationConfig[]>(
        ['animations'],
        async () => {
            const response = await fetch('/api/avatars/animations');
            if (!response.ok) throw new Error('Failed to fetch animations');
            return response.json();
        }
    );

    // Fetch user's avatar
    const { data: avatarUrl, isLoading: loadingAvatar } = useQuery<string>(
        ['avatar', userId],
        async () => {
            const response = await fetch(`/api/avatars/user/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch avatar');
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
    );

    // Animation mutation
    const animateMutation = useMutation(
        async ({ animation, frame }: { animation: string; frame?: number }) => {
            const response = await fetch('/api/avatars/animate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ animation, frame }),
            });
            if (!response.ok) throw new Error('Failed to animate avatar');
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
    );

    // Load animation
    const loadAnimation = useCallback(async (animationName: string) => {
        if (!avatarRef.current) return;

        try {
            // Clean up previous animation
            if (animationRef.current) {
                animationRef.current.destroy();
            }

            // Get animation config
            const config = animations?.find(a => a.name === animationName);
            if (!config) throw new Error('Animation not found');

            // Create new animation
            const response = await fetch(`/api/avatars/preview/${animationName}`);
            if (!response.ok) throw new Error('Failed to load animation');
            const data = await response.json();

            animationRef.current = lottie.loadAnimation({
                container: avatarRef.current,
                renderer: 'svg',
                loop: isLooping,
                autoplay: false,
                animationData: data,
            });

            // Set up event listeners
            animationRef.current.addEventListener('complete', () => {
                setIsPlaying(false);
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            });

            setCurrentAnimation(animationName);
        } catch (error) {
            console.error('Failed to load animation:', error);
        }
    }, [animations, isLooping, onAnimationComplete]);

    // Handle animation controls
    const handlePlay = () => {
        if (animationRef.current) {
            animationRef.current.play();
            setIsPlaying(true);
        }
    };

    const handlePause = () => {
        if (animationRef.current) {
            animationRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleStop = () => {
        if (animationRef.current) {
            animationRef.current.stop();
            setIsPlaying(false);
        }
    };

    const handleLoop = () => {
        setIsLooping(!isLooping);
        if (animationRef.current) {
            animationRef.current.loop = !isLooping;
        }
    };

    // Animation menu
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAnimationSelect = (animationName: string) => {
        loadAnimation(animationName);
        handleMenuClose();
    };

    // Load default animation
    useEffect(() => {
        if (defaultAnimation && animations) {
            loadAnimation(defaultAnimation);
        }
    }, [defaultAnimation, animations, loadAnimation]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                animationRef.current.destroy();
            }
        };
    }, []);

    if (loadingAnimations || loadingAvatar) {
        return <CircularProgress />;
    }

    return (
        <Box className={className}>
            <StyledAvatar
                ref={avatarRef}
                src={avatarUrl}
                sx={{ width: size, height: size }}
                onClick={handleMenuOpen}
            >
                <Controls className="controls">
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            isPlaying ? handlePause() : handlePlay();
                        }}
                    >
                        {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStop();
                        }}
                    >
                        <Stop />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLoop();
                        }}
                        color={isLooping ? 'primary' : 'default'}
                    >
                        <Loop />
                    </IconButton>
                </Controls>
            </StyledAvatar>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {animations?.map((animation) => (
                    <MenuItem
                        key={animation.name}
                        onClick={() => handleAnimationSelect(animation.name)}
                        selected={currentAnimation === animation.name}
                    >
                        {animation.name}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default AnimatedAvatar; 