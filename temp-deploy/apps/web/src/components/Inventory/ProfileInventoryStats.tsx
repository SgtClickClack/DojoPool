import { UserInventoryItem } from '@/services/marketplaceService';
import { Box, Grid, Paper, Typography } from '@mui/material';

interface ProfileInventoryStatsProps {
  inventory: UserInventoryItem[];
}

export const ProfileInventoryStats: React.FC<ProfileInventoryStatsProps> = ({
  inventory,
}) => {
  const totalItems = inventory.length;
  const equippedItems = inventory.filter((item) => item.equipped).length;
  const legendaryItems = inventory.filter(
    (item) => item.rarity === 'legendary'
  ).length;
  const categories = new Set(inventory.map((item) => item.type)).size;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            >
              {totalItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Items
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              color="success.main"
              sx={{ fontWeight: 'bold' }}
            >
              {equippedItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Equipped
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              color="warning.main"
              sx={{ fontWeight: 'bold' }}
            >
              {legendaryItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Legendary
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              color="info.main"
              sx={{ fontWeight: 'bold' }}
            >
              {categories}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
