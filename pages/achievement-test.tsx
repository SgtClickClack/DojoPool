import { Box, Button, Container, Paper, Typography } from '@mui/material';
import Head from 'next/head';
import { useState } from 'react';
import AchievementPanel from '../apps/web/src/components/game/AchievementPanel';
import TournamentList from '../apps/web/src/components/tournament/TournamentList';

export default function AchievementTestPage() {
  const [showAchievements, setShowAchievements] = useState(false);
  const [recentUnlocks, setRecentUnlocks] = useState<any[]>([]);

  const handleAchievementUnlocked = (achievement: any) => {
    setRecentUnlocks((prev) => [achievement, ...prev.slice(0, 4)]);
    console.log('Achievement unlocked:', achievement);
  };

  const simulateTournamentWin = () => {
    // Simulate a tournament win that would trigger an achievement
    console.log('Tournament won! This should trigger achievement checks...');
    // In a real system, this would call the achievement service
  };

  return (
    <>
      <Head>
        <title>Achievement System Test - DojoPool</title>
        <meta
          name="description"
          content="Test the achievement system integration"
        />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h3" sx={{ mb: 4, textAlign: 'center' }}>
          🏆 Achievement System Test
        </Typography>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={() => setShowAchievements(!showAchievements)}
            sx={{ mr: 2 }}
          >
            {showAchievements ? 'Hide' : 'Show'} Achievements
          </Button>

          <Button
            variant="outlined"
            onClick={simulateTournamentWin}
            sx={{ mr: 2 }}
          >
            🎯 Simulate Tournament Win
          </Button>
        </Box>

        {recentUnlocks.length > 0 && (
          <Paper sx={{ p: 2, mb: 4, bgcolor: 'success.light' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              🎉 Recent Achievement Unlocks
            </Typography>
            {recentUnlocks.map((achievement, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                ✅ {achievement.title} - {achievement.description}
              </Typography>
            ))}
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              🏁 Tournaments
            </Typography>
            <TournamentList />
          </Box>

          {showAchievements && (
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                🏆 Achievements
              </Typography>
              <AchievementPanel
                onAchievementUnlocked={handleAchievementUnlocked}
                onClose={() => setShowAchievements(false)}
              />
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}
