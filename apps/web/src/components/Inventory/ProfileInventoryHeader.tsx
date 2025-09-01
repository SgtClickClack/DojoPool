import { UserBalance } from '@/services/marketplaceService';
import { AttachMoney as AttachMoneyIcon } from '@mui/icons-material';
import { Box, Paper, Typography } from '@mui/material';

interface ProfileInventoryHeaderProps {
  userBalance: UserBalance | null;
}

export const ProfileInventoryHeader: React.FC<ProfileInventoryHeaderProps> = ({
  userBalance,
}) => {
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}
          >
            Inventory
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Your collection of Dojo items and collectibles
          </Typography>
        </Box>

        {userBalance && (
          <Paper
            sx={{
              p: 2,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoneyIcon sx={{ color: '#ffd700', fontSize: 28 }} />
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 'bold', color: '#1a1a1a' }}
                >
                  {userBalance.dojoCoins.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  DojoCoins
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Paper>
  );
};
