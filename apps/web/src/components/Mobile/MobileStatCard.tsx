import { useIsMobile } from '@/hooks/useDevice';
import { useSwipe } from '@/hooks/useTouch';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import React from 'react';

interface MobileStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onClick?: () => void;
}

const MobileStatCard: React.FC<MobileStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  onSwipeLeft,
  onSwipeRight,
  onClick,
}) => {
  const theme = useTheme();
  const isMobile = useIsMobile();

  const handleSwipe = (result: any) => {
    if (result.direction === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (result.direction === 'right' && onSwipeRight) {
      onSwipeRight();
    }
  };

  const { bindSwipe } = useSwipe(handleSwipe, {
    threshold: 50,
    velocity: 0.3,
  });

  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (cardRef.current && isMobile) {
      bindSwipe(cardRef.current);
    }
  }, [bindSwipe, isMobile]);

  return (
    <Card
      ref={cardRef}
      onClick={onClick}
      sx={{
        background: theme.cyberpunk.gradients.card,
        border: `1px solid ${theme.palette[color].main}`,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.cyberpunk.shadows.elevated,
          border: `1px solid ${theme.palette[color].light}`,
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      <CardContent sx={{ p: 2, textAlign: 'center', position: 'relative' }}>
        {/* Icon with glow effect */}
        {Icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: `${theme.palette[color].main}20`,
              margin: '0 auto 12px',
              boxShadow: `0 0 15px ${theme.palette[color].main}40`,
            }}
          >
            <Icon
              sx={{
                fontSize: 28,
                color: theme.palette[color].main,
              }}
            />
          </Box>
        )}

        {/* Value with text shadow */}
        <Typography
          variant="h4"
          sx={{
            color: theme.palette[color].main,
            fontWeight: 'bold',
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            mb: subtitle ? 0.5 : 1,
            textShadow: `0 0 10px ${theme.palette[color].main}50`,
          }}
        >
          {value}
        </Typography>

        {/* Title */}
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 600,
            fontSize: isMobile ? '0.9rem' : '1rem',
            mb: subtitle ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>

        {/* Subtitle */}
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: isMobile ? '0.75rem' : '0.8rem',
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Mobile swipe indicators */}
        {isMobile && (onSwipeLeft || onSwipeRight) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 1,
            }}
          >
            {onSwipeLeft && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.text.disabled,
                  opacity: 0.5,
                }}
              />
            )}
            {onSwipeRight && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.text.disabled,
                  opacity: 0.5,
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileStatCard;
