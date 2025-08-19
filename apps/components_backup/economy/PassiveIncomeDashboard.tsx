import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import {
  TrendingUp,
  AccountBalance,
  Timeline,
  Settings,
  Refresh,
  PlayArrow,
  Stop,
  Visibility,
} from '@mui/icons-material';
import { usePassiveIncome } from '../../hooks/usePassiveIncome';
import { type TerritoryIncome } from '../../services/economy/PassiveIncomeService';

interface PassiveIncomeDashboardProps {
  className?: string;
}

export const PassiveIncomeDashboard: React.FC<PassiveIncomeDashboardProps> = ({
  className = '',
}) => {
  const {
    territoryIncomes,
    payoutHistory,
    config,
    stats,
    loading,
    error,
    registerTerritory,
    updateVenueActivity,
    getTerritoryIncome,
    getPayoutHistory,
    getUserTotalEarnings,
    updateConfig,
    startSystem,
    stopSystem,
    refreshData,
    clearError,
  } = usePassiveIncome();

  const [selectedTerritory, setSelectedTerritory] =
    useState<TerritoryIncome | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [configForm, setConfigForm] = useState({
    baseRate: config?.baseRate || 10,
    territoryBonus: config?.territoryBonus || 0.5,
    venueActivityBonus: config?.venueActivityBonus || 0.3,
    clanBonus: config?.clanBonus || 0.2,
    maxIncomePerHour: config?.maxIncomePerHour || 100,
    payoutInterval: config?.payoutInterval || 15,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DOJO',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const handleConfigUpdate = async () => {
    try {
      await updateConfig(configForm);
      setShowConfigDialog(false);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const handleViewPayouts = (territory: TerritoryIncome) => {
    setSelectedTerritory(territory);
    setShowPayoutDialog(true);
  };

  const getIncomeColor = (income: number) => {
    if (income >= 50) return 'success';
    if (income >= 25) return 'warning';
    return 'error';
  };

  const getActivityScore = (activity: any) => {
    const playerScore = Math.min(activity.playerCount / 10, 1);
    const matchScore = Math.min(activity.matchCount / 5, 1);
    const tournamentScore = Math.min(activity.tournamentCount / 2, 1);
    const revenueScore = Math.min(activity.revenue / 1000, 1);
    return (
      ((playerScore + matchScore + tournamentScore + revenueScore) / 4) * 100
    );
  };

  if (loading.territories && territoryIncomes.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={className}>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ color: '#00ff9d', fontWeight: 'bold' }}>
          Passive Income Dashboard
        </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={refreshData} disabled={loading.territories}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Configuration">
            <IconButton onClick={() => setShowConfigDialog(true)}>
              <Settings />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={startSystem}
            sx={{ ml: 1, backgroundColor: '#00ff9d', color: '#000' }}
          >
            Start System
          </Button>
          <Button
            variant="outlined"
            startIcon={<Stop />}
            onClick={stopSystem}
            sx={{ ml: 1, borderColor: '#ff4757', color: '#ff4757' }}
          >
            Stop System
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid2 xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(0, 255, 157, 0.1)',
                border: '1px solid #00ff9d',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance sx={{ color: '#00ff9d', mr: 1 }} />
                  <Typography variant="h6" color="white">
                    Total Territories
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ color: '#00ff9d', fontWeight: 'bold' }}
                >
                  {stats.totalTerritories}
                </Typography>
                <Typography variant="body2" color="gray">
                  Active: {stats.totalActiveTerritories}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(0, 168, 255, 0.1)',
                border: '1px solid #00a8ff',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp sx={{ color: '#00a8ff', mr: 1 }} />
                  <Typography variant="h6" color="white">
                    Total Income/Hour
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ color: '#00a8ff', fontWeight: 'bold' }}
                >
                  {formatCurrency(stats.totalIncomePerHour)}
                </Typography>
                <Typography variant="body2" color="gray">
                  Avg: {formatCurrency(stats.averageIncomePerTerritory)}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(254, 202, 87, 0.1)',
                border: '1px solid #feca57',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Timeline sx={{ color: '#feca57', mr: 1 }} />
                  <Typography variant="h6" color="white">
                    Total Earned
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ color: '#feca57', fontWeight: 'bold' }}
                >
                  {formatCurrency(stats.totalEarned)}
                </Typography>
                <Typography variant="body2" color="gray">
                  All Time
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: 'rgba(255, 71, 87, 0.1)',
                border: '1px solid #ff4757',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance sx={{ color: '#ff4757', mr: 1 }} />
                  <Typography variant="h6" color="white">
                    Clan Controlled
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{ color: '#ff4757', fontWeight: 'bold' }}
                >
                  {stats.clanControlledTerritories}
                </Typography>
                <Typography variant="body2" color="gray">
                  {(
                    (stats.clanControlledTerritories / stats.totalTerritories) *
                    100
                  ).toFixed(1)}
                  %
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
        </Grid>
      )}

      {/* Territory Incomes Table */}
      <Card
        sx={{
          backgroundColor: 'rgba(30, 30, 40, 0.95)',
          border: '1px solid #333',
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
            Territory Incomes
          </Typography>
          <TableContainer
            component={Paper}
            sx={{ backgroundColor: 'transparent' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#00ff9d' }}>Territory ID</TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>Owner</TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>Clan</TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>Base Income</TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>
                    Total Income/Hour
                  </TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>Total Earned</TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>
                    Activity Score
                  </TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>Next Payout</TableCell>
                  <TableCell sx={{ color: '#00ff9d' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {territoryIncomes.map((territory) => (
                  <TableRow
                    key={territory.territoryId}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(0, 255, 157, 0.05)' },
                    }}
                  >
                    <TableCell sx={{ color: 'white' }}>
                      {territory.territoryId}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {territory.ownerId}
                    </TableCell>
                    <TableCell>
                      {territory.clanId ? (
                        <Chip
                          label={territory.clanId}
                          size="small"
                          sx={{ backgroundColor: '#00a8ff' }}
                        />
                      ) : (
                        <Chip
                          label="None"
                          size="small"
                          sx={{ backgroundColor: '#666' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {formatCurrency(territory.baseIncome)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatCurrency(territory.totalIncome)}
                        color={getIncomeColor(territory.totalIncome) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {formatCurrency(territory.totalEarned)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${getActivityScore(territory.venueActivity).toFixed(0)}%`}
                        color={
                          getActivityScore(territory.venueActivity) >= 50
                            ? 'success'
                            : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {formatTime(territory.nextPayout)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Payouts">
                        <IconButton
                          size="small"
                          onClick={() => handleViewPayouts(territory)}
                        >
                          <Visibility sx={{ color: '#00a8ff' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#00ff9d' }}>
          Passive Income Configuration
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid2 xs={6}>
              <TextField
                fullWidth
                label="Base Rate (DOJO/hour)"
                type="number"
                value={configForm.baseRate}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    baseRate: Number(e.target.value),
                  }))
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiInputBase-input': { color: 'white' },
                }}
              />
            </Grid2>
            <Grid2 xs={6}>
              <TextField
                fullWidth
                label="Territory Bonus (%)"
                type="number"
                value={configForm.territoryBonus * 100}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    territoryBonus: Number(e.target.value) / 100,
                  }))
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiInputBase-input': { color: 'white' },
                }}
              />
            </Grid2>
            <Grid2 xs={6}>
              <TextField
                fullWidth
                label="Activity Bonus (%)"
                type="number"
                value={configForm.venueActivityBonus * 100}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    venueActivityBonus: Number(e.target.value) / 100,
                  }))
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiInputBase-input': { color: 'white' },
                }}
              />
            </Grid2>
            <Grid2 xs={6}>
              <TextField
                fullWidth
                label="Clan Bonus (%)"
                type="number"
                value={configForm.clanBonus * 100}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    clanBonus: Number(e.target.value) / 100,
                  }))
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiInputBase-input': { color: 'white' },
                }}
              />
            </Grid2>
            <Grid2 xs={6}>
              <TextField
                fullWidth
                label="Max Income/Hour"
                type="number"
                value={configForm.maxIncomePerHour}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    maxIncomePerHour: Number(e.target.value),
                  }))
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiInputBase-input': { color: 'white' },
                }}
              />
            </Grid2>
            <Grid2 xs={6}>
              <TextField
                fullWidth
                label="Payout Interval (minutes)"
                type="number"
                value={configForm.payoutInterval}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    payoutInterval: Number(e.target.value),
                  }))
                }
                sx={{
                  '& .MuiInputLabel-root': { color: '#ccc' },
                  '& .MuiInputBase-input': { color: 'white' },
                }}
              />
            </Grid2>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfigDialog(false)}
            sx={{ color: '#ccc' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfigUpdate}
            sx={{ backgroundColor: '#00ff9d', color: '#000' }}
          >
            Update Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payout History Dialog */}
      <Dialog
        open={showPayoutDialog}
        onClose={() => setShowPayoutDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#00ff9d' }}>
          Payout History - {selectedTerritory?.territoryId}
        </DialogTitle>
        <DialogContent>
          {selectedTerritory && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#00ff9d' }}>Date</TableCell>
                    <TableCell sx={{ color: '#00ff9d' }}>Amount</TableCell>
                    <TableCell sx={{ color: '#00ff9d' }}>Base</TableCell>
                    <TableCell sx={{ color: '#00ff9d' }}>Territory</TableCell>
                    <TableCell sx={{ color: '#00ff9d' }}>Activity</TableCell>
                    <TableCell sx={{ color: '#00ff9d' }}>Clan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getPayoutHistory(selectedTerritory.territoryId).map(
                    (payout) => (
                      <TableRow key={payout.id}>
                        <TableCell sx={{ color: 'white' }}>
                          {formatTime(payout.timestamp)}
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          {formatCurrency(payout.breakdown.base)}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          {formatCurrency(payout.breakdown.territory)}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          {formatCurrency(payout.breakdown.activity)}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>
                          {formatCurrency(payout.breakdown.clan)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowPayoutDialog(false)}
            sx={{ color: '#ccc' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
