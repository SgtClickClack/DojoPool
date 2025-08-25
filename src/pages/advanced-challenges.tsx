import {
  Alert,
  AlertTitle,
  Box,
  Container,
  Typography,
  Stack,
} from '@mui/material';
import React from 'react';
// import { AdvancedChallengeManager } from '../../../../../apps/web/src/components/challenge/AdvancedChallengeManager';

const AdvancedChallengesPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Advanced Challenge Features
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Comprehensive challenge management with eligibility checking,
            statistics, and automated expiration handling.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <AlertTitle>New Features Implemented:</AlertTitle>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">
              • Challenge requirements validation and player eligibility checks
              <br />
              • Challenge expiration and auto-decline functionality
              <br />
              • Challenge history and statistics tracking
              <br />
              • Challenge notifications and real-time updates
              <br />
              • Challenge rewards and progression system
              <br />
              • Challenge match scheduling and coordination
              <br />• Advanced challenge analytics and reporting
            </Typography>
          </Box>
        </Alert>

        {/* <AdvancedChallengeManager
          playerId="player-1"
          onChallengeUpdate={() => {
            console.log('Challenge updated');
          }}
        /> */}
        <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Challenge Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Advanced challenge manager temporarily unavailable. This component
            will be implemented in a future update.
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
};

export default AdvancedChallengesPage;
