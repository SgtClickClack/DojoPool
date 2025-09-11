import SeasonalBattlePass from '@/components/BattlePass/SeasonalBattlePass';
import ProtectedRoute from '@/components/Common/ProtectedRoute';
import {
  Breadcrumbs,
  Container,
  Link as MuiLink,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import React from 'react';

const BattlePassPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/" underline="hover">
            Home
          </MuiLink>
          <Typography color="text.primary">Battle Pass</Typography>
        </Breadcrumbs>

        {/* Main Content */}
        <SeasonalBattlePass />
      </Container>
    </ProtectedRoute>
  );
};

export default BattlePassPage;
