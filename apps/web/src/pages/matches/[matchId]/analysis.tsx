import ProtectedRoute from '@/components/Common/ProtectedRoute';
import MatchAnalysis from '@/components/Insights/MatchAnalysis';
import { Container, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';

const MatchAnalysisPage: React.FC = () => {
  const router = useRouter();
  const { matchId } = router.query as { matchId: string };

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          Match Analysis
        </Typography>
        {matchId && <MatchAnalysis matchId={matchId} />}
      </Container>
    </ProtectedRoute>
  );
};

export default MatchAnalysisPage;
