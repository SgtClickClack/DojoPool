import React from 'react';
import { Typography, Paper, Grid, Card, CardContent, CardMedia, Box } from '@mui/material';
import { RewardItem } from '../../../types/rewards'; // Updated import path
import useRewardsService from '../../hooks/services/useRewardsService'; // Use the actual hook
import { useAuth } from '../../contexts/AuthContext'; // Assuming this path is correct for useAuth

// interface RewardItem { // <- REMOVE THIS LOCAL DEFINITION
//   id: string;
//   name: string;
//   description: string;
//   imageUrl?: string;
//   type: 'NFT' | 'Item' | 'Badge';
//   earnedDate: string;
// }

interface RewardsDisplayPanelProps {
  // Props if any
}

const RewardsDisplayPanel: React.FC<RewardsDisplayPanelProps> = () => {
  const { user } = useAuth(); // Get user from auth context
  // Fetch rewards data for the current user
  const { rewards, loading, error, fetchRewards } = useRewardsService();

  React.useEffect(() => {
    if (user?.id) { // Ensure user and user.id are available
      fetchRewards(user.id);
    } else {
      // Clear rewards data if user logs out
      setTimeout(() => {
        fetchRewards(''); // Will clear rewards in hook
      }, 0);
    }
  }, [user, fetchRewards]);

  // Placeholder data // <- REMOVE THIS PLACEHOLDER DATA
  // const loading = false;
  // const error = null;
  // const rewards: RewardItem[] = [
  //   {
  //     id: '1',
  //     name: 'Golden Cue NFT',
  //     description: 'Awarded for winning the Grand Dojo Championship.',
  //     imageUrl: 'https://via.placeholder.com/150/FFD700/000000?Text=Golden+Cue',
  //     type: 'NFT',
  //     earnedDate: '2024-07-15',
  //   },
  //   {
  //     id: '2',
  //     name: 'Sharpshooter Badge',
  //     description: 'Awarded for achieving 10 consecutive wins.',
  //     imageUrl: 'https://via.placeholder.com/150/C0C0C0/000000?Text=Sharp+Badge',
  //     type: 'Badge',
  //     earnedDate: '2024-06-20',
  //   },
  //   {
  //     id: '3',
  //     name: 'Dojo Master Jersey',
  //     description: 'Unlockable in-game item.',
  //     // imageUrl: undefined, // Example of no image
  //     type: 'Item',
  //     earnedDate: '2024-05-10',
  //   },
  // ];

  return (
    <Paper elevation={3} sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        My Rewards & Trophies
      </Typography>
      {loading && <Typography>Loading rewards...</Typography>}
      {error && <Typography color="error">Error fetching rewards: {typeof error === 'string' ? error : 'An error occurred'}</Typography>}
      {!loading && !error && rewards.length === 0 && (
        <Typography>{user?.id ? 'No rewards earned yet. Keep playing!' : 'Please log in to view your rewards.'}</Typography>
      )}
      {!loading && !error && rewards.length > 0 && (
        <Grid container spacing={2}>
          {rewards.map((reward) => (
            <Grid item xs={12} sm={6} md={4} key={reward.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {reward.imageUrl && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={reward.imageUrl}
                    alt={reward.name}
                    sx={{ objectFit: 'contain', paddingTop: 1 }}
                  />
                )}
                {!reward.imageUrl && (
                  <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.200' }}>
                    <Typography variant="caption" color="textSecondary">No Image</Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {reward.name} <Typography variant="caption">({reward.type})</Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reward.description}
                  </Typography>
                  {reward.earnedDate && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ marginTop: 1 }}>
                      Earned: {new Date(reward.earnedDate).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default RewardsDisplayPanel; 