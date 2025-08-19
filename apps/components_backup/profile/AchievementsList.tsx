import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

// Local type matching the fields used by this component
interface AchievementItem {
  id: string;
  dateUnlocked: string;
  achievement: {
    name: string;
    description?: string;
    icon?: string;
  };
}

interface AchievementsListProps {
  achievements: AchievementItem[];
}

const AchievementsList: React.FC<AchievementsListProps> = ({
  achievements,
}) => {
  if (!achievements || achievements.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="body2" color="text.secondary">
          No achievements unlocked yet. Keep playing to earn your first
          achievement!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {achievements.map((achievement) => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={achievement.id}>
          <Tooltip
            title={
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {achievement.achievement.name}
                </Typography>
                <Typography variant="body2">
                  {achievement.achievement.description ||
                    'No description available'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unlocked:{' '}
                  {new Date(achievement.dateUnlocked).toLocaleDateString()}
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: 1.5,
                  '&:last-child': { pb: 1.5 },
                }}
              >
                <Avatar
                  src={achievement.achievement.icon}
                  alt={achievement.achievement.name}
                  sx={{
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1,
                    bgcolor: 'primary.main',
                  }}
                >
                  {achievement.achievement.name.charAt(0)}
                </Avatar>
                <Typography
                  variant="caption"
                  component="div"
                  sx={{
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {achievement.achievement.name}
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );
};

export default AchievementsList;
