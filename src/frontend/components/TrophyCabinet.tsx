import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  image: string;
}

interface TrophyCabinetProps {
  achievements: Achievement[];
}

const TrophyCabinet: React.FC<TrophyCabinetProps> = ({ achievements }) => {
  const navigate = useNavigate();

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.unlocked ? 'Unlocked' : 'Locked';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as { [key: string]: Achievement[] });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Trophy Cabinet
      </Typography>

      {Object.entries(groupedAchievements).map(([category, achievements]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {category}
          </Typography>
          <Grid container spacing={2}>
            {achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: achievement.unlocked ? 1 : 0.5,
                  }}
                >
                  <CardContent>
                    <Box
                      component="img"
                      src={achievement.image}
                      alt={achievement.name}
                      sx={{
                        width: '100%',
                        height: 150,
                        objectFit: 'contain',
                        mb: 2,
                      }}
                    />
                    <Typography variant="h6" gutterBottom>
                      {achievement.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {achievement.description}
                    </Typography>
                    {achievement.progress !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        Progress: {Math.round(achievement.progress * 100)}%
                      </Typography>
                    )}
                  </CardContent>
                  {achievement.unlocked && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/achievements/${achievement.id}`)}
                    >
                      View Details
                    </Button>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default TrophyCabinet;
