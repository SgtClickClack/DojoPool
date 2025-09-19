import { Box, Card, CardContent, Typography } from '@mui/material';

export interface InventoryStatsProps {
  totalItems: number;
  equippedItems: number;
  totalValue: number;
  rareItems: number;
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({
  totalItems,
  equippedItems,
  totalValue,
  rareItems,
}) => {
  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      color: 'primary.main',
    },
    {
      label: 'Equipped',
      value: equippedItems,
      color: 'success.main',
    },
    {
      label: 'Rare Items',
      value: rareItems,
      color: 'warning.main',
    },
    {
      label: 'Total Value',
      value: `${totalValue.toLocaleString()} Dojo Coins`,
      color: 'secondary.main',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}
    >
      {stats.map((stat, index) => (
        <Card key={index} sx={{ height: '100%' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography
              variant="h4"
              component="div"
              sx={{ color: stat.color, fontWeight: 'bold', mb: 0.5 }}
            >
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
