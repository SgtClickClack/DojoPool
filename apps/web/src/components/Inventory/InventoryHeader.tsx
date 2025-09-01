import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';

interface InventoryHeaderProps {
  title?: string;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  title = '🎒 My Inventory',
}) => {
  const router = useRouter();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Button
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        onClick={() => router.back()}
      >
        Back
      </Button>
      <Typography variant="h4" sx={{ textAlign: 'center', flex: 1 }}>
        {title}
      </Typography>
      <Box sx={{ width: 100 }} /> {/* Spacer */}
    </Stack>
  );
};
