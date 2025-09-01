import {
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
  styled,
} from '@mui/material';
import React from 'react';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.3,
  },
}));

const MasterAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  border: '4px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
}));

const StatBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
}));

export interface DojoMaster {
  id: string;
  username: string;
  avatar: string;
  title: string;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalGames: number;
  currentStreak: number;
  bestStreak: number;
  dojoControlDays: number;
  achievements: string[];
}

interface DojoMasterDisplayProps {
  master: DojoMaster;
  dojoName: string;
}

const DojoMasterDisplay: React.FC<DojoMasterDisplayProps> = ({
  master,
  dojoName,
}) => {
  const getWinRateColor = (rate: number) => {
    if (rate >= 80) return '#4caf50';
    if (rate >= 60) return '#ff9800';
    return '#f44336';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 5) return '#4caf50';
    if (streak >= 3) return '#ff9800';
    return '#f44336';
  };

  return (
    <StyledCard>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <TrophyIcon sx={{ fontSize: 32, mr: 2, color: '#ffd700' }} />
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Dojo Master
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Reigning Champion of {dojoName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', mb: 3 }} />

        {/* Master Profile */}
        <Box display="flex" alignItems="center" mb={3}>
          <MasterAvatar src={master.avatar} alt={master.username} />
          <Box ml={3}>
            <Typography variant="h4" component="h3" gutterBottom>
              {master.username}
            </Typography>
            <Chip
              label={master.title}
              color="primary"
              variant="filled"
              sx={{
                backgroundColor: '#ffd700',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '0.9rem',
              }}
            />
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <StatBox>
            <Typography variant="h6" sx={{ color: '#4caf50' }}>
              {master.winCount}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Wins
            </Typography>
          </StatBox>

          <StatBox>
            <Typography variant="h6" sx={{ color: '#f44336' }}>
              {master.lossCount}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Losses
            </Typography>
          </StatBox>

          <StatBox>
            <Typography
              variant="h6"
              sx={{ color: getWinRateColor(master.winRate) }}
            >
              {master.winRate}%
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Win Rate
            </Typography>
          </StatBox>

          <StatBox>
            <Typography
              variant="h6"
              sx={{ color: getStreakColor(master.currentStreak) }}
            >
              {master.currentStreak}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Current Streak
            </Typography>
          </StatBox>
        </Box>

        {/* Additional Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
          }}
        >
          <StatBox>
            <Box display="flex" alignItems="center" justifyContent="center">
              <StarIcon sx={{ fontSize: 20, mr: 1, color: '#ffd700' }} />
              <Typography variant="body2">
                Best: {master.bestStreak} wins
              </Typography>
            </Box>
          </StatBox>

          <StatBox>
            <Box display="flex" alignItems="center" justifyContent="center">
              <TrendingIcon sx={{ fontSize: 20, mr: 1, color: '#4caf50' }} />
              <Typography variant="body2">
                {master.dojoControlDays} days
              </Typography>
            </Box>
          </StatBox>
        </Box>

        {/* Achievements */}
        {master.achievements.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ opacity: 0.9 }}>
              Recent Achievements
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {master.achievements.slice(0, 3).map((achievement, index) => (
                <Chip
                  key={index}
                  label={achievement}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '& .MuiChip-label': { color: 'white' },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default DojoMasterDisplay;
