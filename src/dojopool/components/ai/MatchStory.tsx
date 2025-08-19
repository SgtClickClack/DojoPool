import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Psychology as InsightIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkOutlineIcon,
} from '@mui/icons-material';

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
}

interface Highlight {
  timestamp: string;
  description: string;
  type: 'achievement' | 'milestone' | 'insight';
}

interface MatchStoryProps {
  title: string;
  date: string;
  players: Player[];
  story: string;
  highlights: Highlight[];
  isBookmarked: boolean;
  onBookmark: () => void;
  onShare: () => void;
}

export const MatchStory: React.FC<MatchStoryProps> = ({
  title,
  date,
  players,
  story,
  highlights,
  isBookmarked,
  onBookmark,
  onShare,
}) => {
  const theme = useTheme();

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <TrophyIcon color="primary" />;
      case 'milestone':
        return <TimelineIcon color="secondary" />;
      case 'insight':
        return <InsightIcon color="info" />;
      default:
        return <TrophyIcon />;
    }
  };

  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return theme.palette.primary.main;
      case 'milestone':
        return theme.palette.secondary.main;
      case 'insight':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Stack spacing={3}>
      {/* Header Card */}
      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {date}
              </Typography>
            </Box>
            <Box>
              <Tooltip
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
              >
                <IconButton onClick={onBookmark}>
                  {isBookmarked ? (
                    <BookmarkIcon color="primary" />
                  ) : (
                    <BookmarkOutlineIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share story">
                <IconButton onClick={onShare}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Players */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {players.map((player, index) => (
              <Box
                key={player.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Avatar src={player.avatar} alt={player.name} />
                <Box>
                  <Typography variant="subtitle2">{player.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Score: {player.score}
                  </Typography>
                </Box>
                {index === 0 && (
                  <TrophyIcon
                    sx={{
                      ml: 1,
                      color: theme.palette.warning.main,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Story Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Match Story
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {story}
          </Typography>
        </CardContent>
      </Card>

      {/* Highlights Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Match Highlights
          </Typography>
          <Stack spacing={2}>
            {highlights.map((highlight, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: `${getHighlightColor(highlight.type)}20`,
                    }}
                  >
                    {getHighlightIcon(highlight.type)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Chip
                        label={
                          highlight.type.charAt(0).toUpperCase() +
                          highlight.type.slice(1)
                        }
                        size="small"
                        sx={{
                          backgroundColor: `${getHighlightColor(highlight.type)}20`,
                          color: getHighlightColor(highlight.type),
                          mb: 1,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {highlight.timestamp}
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {highlight.description}
                    </Typography>
                  </Box>
                </Box>
              </React.Fragment>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};
