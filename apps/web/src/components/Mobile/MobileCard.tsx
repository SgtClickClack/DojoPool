import { useIsMobile } from '@/hooks/useDevice';
import { useLongPress, useSwipe, useTap } from '@/hooks/useTouch';
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useRef, useState } from 'react';

interface MobileCardProps {
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  image?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  favorite?: boolean;
  elevation?: number;
  sx?: any;
}

const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  content,
  image,
  avatar,
  actions,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onDoubleTap,
  onFavorite,
  onShare,
  favorite = false,
  elevation = 2,
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFavorited, setIsFavorited] = useState(favorite);
  const [isSwiping, setIsSwiping] = useState(false);

  // Touch gesture handlers
  const handleSwipe = (result: any) => {
    if (!isMobile) return;

    setIsSwiping(true);

    setTimeout(() => setIsSwiping(false), 300); // Reset after animation

    if (result.direction === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (result.direction === 'right' && onSwipeRight) {
      onSwipeRight();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const handleDoubleTap = () => {
    if (onDoubleTap) {
      onDoubleTap();
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    if (onFavorite) {
      onFavorite();
    }
  };

  // Bind swipe gesture
  useSwipe(handleSwipe, {
    threshold: isMobile ? 50 : 100,
    velocity: 0.3,
  }).bindSwipe(cardRef.current);

  // Bind long press
  const longPressHandlers = useLongPress(
    handleLongPress,
    () => {}, // Empty click handler
    500
  );

  // Bind tap gestures
  const tapHandlers = useTap(
    () => {}, // Single tap - handled by default click
    handleDoubleTap,
    300
  );

  if (!isMobile) {
    // Desktop version - simpler card
    return (
      <Card
        elevation={elevation}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
          ...sx,
        }}
      >
        {image && (
          <Box
            sx={{
              height: 200,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {avatar}
            <Box sx={{ ml: avatar ? 2 : 0, flex: 1 }}>
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {content && <Box sx={{ mt: 2 }}>{content}</Box>}
        </CardContent>

        {actions && <CardActions>{actions}</CardActions>}
      </Card>
    );
  }

  // Mobile version with touch gestures
  return (
    <Card
      ref={cardRef}
      elevation={elevation}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isSwiping ? 'scale(0.95)' : 'scale(1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.cyberpunk.shadows.elevated,
        },
        background: theme.cyberpunk.gradients.card,
        border: `1px solid ${theme.palette.primary.main}30`,
        borderRadius: 2,
        ...sx,
      }}
      {...longPressHandlers}
      {...tapHandlers}
    >
      {image && (
        <Box
          sx={{
            height: 150,
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px 8px 0 0',
          }}
        />
      )}

      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          {avatar && <Box sx={{ mr: 2 }}>{avatar}</Box>}

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                color: theme.palette.text.primary,
                fontSize: '1.1rem',
                fontWeight: 600,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Mobile action menu */}
          <IconButton
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
              },
            }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>

        {content && <Box sx={{ mt: 2 }}>{content}</Box>}
      </CardContent>

      {/* Mobile-specific actions */}
      {isMobile && (
        <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleFavorite}
              sx={{
                color: isFavorited
                  ? theme.palette.error.main
                  : theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.error.main,
                },
              }}
            >
              {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>

            {onShare && (
              <IconButton
                size="small"
                onClick={onShare}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <ShareIcon />
              </IconButton>
            )}
          </Box>

          {actions}
        </CardActions>
      )}

      {/* Swipe indicator */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            borderRadius: 2,
            border: isSwiping
              ? `2px solid ${theme.palette.primary.main}`
              : 'none',
            transition: 'border-color 0.3s ease',
          }}
        />
      )}
    </Card>
  );
};

export default MobileCard;
