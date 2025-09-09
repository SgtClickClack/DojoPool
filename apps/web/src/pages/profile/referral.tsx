import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import referralService, {
  ReferralDetails,
  ReferralStats,
  ReferralStatus,
  RewardStatus,
} from '@/services/referralService';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const ReferralDashboard: React.FC = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchReferralData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const [codeResponse, statsResponse, detailsResponse] = await Promise.all([
        referralService.getReferralCode(),
        referralService.getReferralStats(),
        referralService.getReferralDetails(),
      ]);

      setReferralCode(codeResponse.referralCode);
      setStats(statsResponse);
      setReferrals(detailsResponse);
    } catch (err: any) {
      console.error('Failed to fetch referral data:', err);
      setError(err.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [user]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const generateShareUrl = () => {
    return `${window.location.origin}/auth/register?ref=${referralCode}`;
  };

  const generateShareMessage = () => {
    return `Join me on DojoPool and get bonus DojoCoins! Use my referral code: ${referralCode}\n\n${generateShareUrl()}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join DojoPool!',
          text: generateShareMessage(),
          url: generateShareUrl(),
        });
        setShareDialogOpen(false);
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const getStatusIcon = (status: ReferralStatus) => {
    switch (status) {
      case ReferralStatus.COMPLETED:
        return <CheckCircleIcon color="success" />;
      case ReferralStatus.PENDING:
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: ReferralStatus) => {
    switch (status) {
      case ReferralStatus.COMPLETED:
        return 'success';
      case ReferralStatus.PENDING:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRewardStatusColor = (status: RewardStatus) => {
    switch (status) {
      case RewardStatus.CLAIMED:
        return 'success';
      case RewardStatus.PENDING:
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5">
            Please log in to view your referral dashboard.
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Referral Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Referral Code Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Referral Code
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    value={referralCode}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<ContentCopy />}
                      onClick={handleCopyCode}
                      disabled={!referralCode}
                    >
                      {copySuccess ? 'Copied!' : 'Copy Code'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      onClick={handleShare}
                      disabled={!referralCode}
                    >
                      Share
                    </Button>
                    <IconButton onClick={fetchReferralData} disabled={loading}>
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Referrals
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.totalReferrals || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Completed Referrals
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.completedReferrals || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Rewards
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.pendingRewards || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Earned
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.totalEarned || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      DojoCoins
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Referral Details Table */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Referral History
              </Typography>
              {referrals.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PersonAddIcon
                    sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant="h6" color="textSecondary">
                    No referrals yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Share your referral code to start earning rewards!
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reward</TableCell>
                        <TableCell>Reward Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {referral.referralCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {referral.inviteeUsername ? (
                              <Typography variant="body2">
                                {referral.inviteeUsername}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                Not claimed
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(referral.status)}
                              label={referral.status}
                              color={getStatusColor(referral.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {referral.rewardAmount} DojoCoins
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={referral.rewardStatus}
                              color={getRewardStatusColor(
                                referral.rewardStatus
                              )}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(
                                referral.createdAt
                              ).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}

        {/* Share Dialog */}
        <Dialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Share Your Referral Code</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Share this link with friends to earn DojoCoins when they sign up!
            </Typography>
            <TextField
              fullWidth
              value={generateShareUrl()}
              InputProps={{
                readOnly: true,
              }}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" sx={{ mb: 2 }}>
              Or share this message:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={generateShareMessage()}
              InputProps={{
                readOnly: true,
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
            {navigator.share && (
              <Button onClick={handleNativeShare} variant="contained">
                Share
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ReferralDashboard;
