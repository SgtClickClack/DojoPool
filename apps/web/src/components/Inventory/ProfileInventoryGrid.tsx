import { UserInventoryItem } from '@/services/marketplaceService';
import { Button, Grid, Paper, Typography } from '@mui/material';
import { ProfileInventoryItemCard } from './ProfileInventoryItemCard';

interface ProfileInventoryGridProps {
  inventory: UserInventoryItem[];
  onEquipItem: (item: UserInventoryItem) => void;
}

export const ProfileInventoryGrid: React.FC<ProfileInventoryGridProps> = ({
  inventory,
  onEquipItem,
}) => {
  if (inventory.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your inventory is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Visit the marketplace to purchase your first items!
        </Typography>
        <Button variant="contained" color="primary" href="/marketplace">
          Go to Marketplace
        </Button>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {inventory.map((item) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
          <ProfileInventoryItemCard item={item} onEquipItem={onEquipItem} />
        </Grid>
      ))}
    </Grid>
  );
};
