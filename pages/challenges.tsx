import AccessTime from '@mui/icons-material/AccessTime';
import Cancel from '@mui/icons-material/Cancel';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { useChallenge } from '../src/contexts/ChallengeContext';
import { useNotifications } from '../src/hooks/[NOTIFY]useNotifications';
import { respondToChallenge } from '../src/services/APIService';
import {
  formatChallengeDate,
  getExpirationColor,
  getTimeUntilExpiration,
  isChallengeExpired,
} from '../src/utils/challengeUtils';

interface Challenge {
  id: string;
  challengerId: string;
  defenderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  stakeCoins: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

const ChallengesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { challenges, updateChallenge } = useChallenge();
  const { addNotification } = useNotifications();

  // Mock current user ID - in real app, get from auth context
  const currentUserId = 'current-user';

  // Update current time every minute for countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Filter challenges by status and expiration
  const activeIncomingChallenges = challenges.filter(
    (challenge) =>
      challenge.defenderId === currentUserId &&
      challenge.status === 'PENDING' &&
      !isChallengeExpired(challenge as any)
  );

  const expiredIncomingChallenges = challenges.filter(
    (challenge) =>
      challenge.defenderId === currentUserId &&
      (challenge.status === 'EXPIRED' || isChallengeExpired(challenge as any))
  );

  const outgoingChallenges = challenges.filter(
    (challenge) => challenge.challengerId === currentUserId
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChallengeResponse = async (
    challengeId: string,
    status: 'ACCEPTED' | 'DECLINED'
  ) => {
    try {
      await respondToChallenge(challengeId, status);
      updateChallenge(challengeId, status);

      const statusText = status === 'ACCEPTED' ? 'accepted' : 'declined';
      addNotification({
        type: status === 'ACCEPTED' ? 'success' : 'info',
        title: 'Challenge Response',
        message: `Challenge ${statusText} successfully!`,
      });
    } catch (error) {
      console.error('Error responding to challenge:', error);
      addNotification({
        type: 'error',
        title: 'Response Failed',
        message: 'Failed to respond to challenge. Please try again.',
      });
    }
  };

  const getStatusColor = (status: Challenge['status'], expiresAt?: string) => {
    if (
      status === 'EXPIRED' ||
      (expiresAt && isChallengeExpired({ ...({} as any), status, expiresAt }))
    ) {
      return 'default';
    }

    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'DECLINED':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderChallengeCard = (challenge: Challenge, isIncoming: boolean) => {
    const isExpired =
      challenge.status === 'EXPIRED' ||
      (challenge.expiresAt && isChallengeExpired(challenge as any));

    return (
      <Card
        key={challenge.id}
        sx={{
          mb: 2,
          opacity: isExpired ? 0.6 : 1,
          bgcolor: isExpired ? 'action.hover' : 'background.paper',
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                {isIncoming ? 'Incoming Challenge' : 'Outgoing Challenge'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {isIncoming ? 'From' : 'To'}:{' '}
                {isIncoming ? challenge.challengerId : challenge.defenderId}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Stakes: {challenge.stakeCoins} coins
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {formatChallengeDate(challenge.createdAt)}
              </Typography>

              {/* Expiration Information */}
              {challenge.expiresAt && challenge.status === 'PENDING' && (
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography
                    variant="body2"
                    color={getExpirationColor(challenge.expiresAt)}
                    sx={{ fontWeight: 'medium' }}
                  >
                    {getTimeUntilExpiration(challenge.expiresAt)}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={isExpired ? 'EXPIRED' : challenge.status}
                color={
                  getStatusColor(challenge.status, challenge.expiresAt) as any
                }
                size="small"
              />

              {isIncoming && challenge.status === 'PENDING' && !isExpired && (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Accept Challenge">
                    <IconButton
                      color="success"
                      onClick={() =>
                        handleChallengeResponse(challenge.id, 'ACCEPTED')
                      }
                    >
                      <CheckCircle />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Decline Challenge">
                    <IconButton
                      color="error"
                      onClick={() =>
                        handleChallengeResponse(challenge.id, 'DECLINED')
                      }
                    >
                      <Cancel />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Challenges
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your incoming and outgoing challenges
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              label={`Active Incoming (${activeIncomingChallenges.length})`}
              id="challenges-tab-0"
              aria-controls="challenges-tabpanel-0"
            />
            <Tab
              label={`Outgoing (${outgoingChallenges.length})`}
              id="challenges-tab-1"
              aria-controls="challenges-tabpanel-1"
            />
            <Tab
              label={`Expired (${expiredIncomingChallenges.length})`}
              id="challenges-tabpanel-2"
              aria-controls="challenges-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Active Incoming Challenges Tab */}
        <div
          role="tabpanel"
          hidden={tabValue !== 0}
          id="challenges-tabpanel-0"
          aria-labelledby="challenges-tab-0"
        >
          <Box sx={{ p: 3 }}>
            {activeIncomingChallenges.length === 0 ? (
              <Alert severity="info">
                No active incoming challenges at the moment.
              </Alert>
            ) : (
              activeIncomingChallenges.map((challenge) =>
                renderChallengeCard(challenge, true)
              )
            )}
          </Box>
        </div>

        {/* Outgoing Challenges Tab */}
        <div
          role="tabpanel"
          hidden={tabValue !== 1}
          id="challenges-tabpanel-1"
          aria-labelledby="challenges-tab-1"
        >
          <Box sx={{ p: 3 }}>
            {outgoingChallenges.length === 0 ? (
              <Alert severity="info">
                No outgoing challenges at the moment.
              </Alert>
            ) : (
              outgoingChallenges.map((challenge) =>
                renderChallengeCard(challenge, false)
              )
            )}
          </Box>
        </div>

        {/* Expired Challenges Tab */}
        <div
          role="tabpanel"
          hidden={tabValue !== 2}
          id="challenges-tabpanel-2"
          aria-labelledby="challenges-tab-2"
        >
          <Box sx={{ p: 3 }}>
            {expiredIncomingChallenges.length === 0 ? (
              <Alert severity="info">No expired challenges to display.</Alert>
            ) : (
              expiredIncomingChallenges.map((challenge) =>
                renderChallengeCard(challenge, true)
              )
            )}
          </Box>
        </div>
      </Card>

      {/* Challenge Statistics */}
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Challenges
              </Typography>
              <Typography variant="h3" color="primary">
                {challenges.length}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Pending
              </Typography>
              <Typography variant="h3" color="warning.main">
                {activeIncomingChallenges.length}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accepted
              </Typography>
              <Typography variant="h3" color="success.main">
                {challenges.filter((c) => c.status === 'ACCEPTED').length}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expired
              </Typography>
              <Typography variant="h3" color="text.secondary">
                {expiredIncomingChallenges.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default ChallengesPage;
