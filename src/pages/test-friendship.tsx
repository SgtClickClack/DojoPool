import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useFriendship } from '../hooks/useFriendship';

const TestFriendshipPage: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState('current-user');
  const [targetUserId, setTargetUserId] = useState('player-1');

  const {
    isFriend,
    hasPendingRequest,
    canSendRequest,
    loading,
    error,
    friendshipStatus,
  } = useFriendship(currentUserId, targetUserId);

  const testScenarios = [
    { id: 'player-1', name: 'Player 1 (Friends)', expected: 'ACCEPTED' },
    { id: 'player-2', name: 'Player 2 (Pending)', expected: 'PENDING' },
    { id: 'player-3', name: 'Player 3 (No friendship)', expected: 'None' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Friendship System Test
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>
          <Typography>Current User ID: {currentUserId}</Typography>
          <Typography>Target User ID: {targetUserId}</Typography>
          <Typography>Loading: {loading ? 'Yes' : 'No'}</Typography>
          <Typography>Is Friend: {isFriend ? 'Yes' : 'No'}</Typography>
          <Typography>
            Has Pending Request: {hasPendingRequest ? 'Yes' : 'No'}
          </Typography>
          <Typography>
            Can Send Request: {canSendRequest ? 'Yes' : 'No'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error: {error}
            </Alert>
          )}

          {friendshipStatus && (
            <Box
              sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}
            >
              <Typography variant="subtitle2">Friendship Details:</Typography>
              <pre>{JSON.stringify(friendshipStatus, null, 2)}</pre>
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Test Different Scenarios
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {testScenarios.map((scenario) => (
          <Button
            key={scenario.id}
            variant="outlined"
            onClick={() => setTargetUserId(scenario.id)}
            sx={{
              borderColor:
                targetUserId === scenario.id ? 'primary.main' : 'grey.300',
              bgcolor:
                targetUserId === scenario.id ? 'primary.50' : 'transparent',
            }}
          >
            {scenario.name}
          </Button>
        ))}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Expected Results:
        </Typography>
        <ul>
          <li>
            <strong>Player 1:</strong> Should show as friends (Challenge button
            visible)
          </li>
          <li>
            <strong>Player 2:</strong> Should show pending friend request
          </li>
          <li>
            <strong>Player 3:</strong> Should show no friendship (Send Friend
            Request button visible)
          </li>
        </ul>
      </Box>
    </Container>
  );
};

export default TestFriendshipPage;
