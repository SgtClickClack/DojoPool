import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Slider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  People,
  EmojiEvents,
  Star,
  Schedule,
  Analytics,
  Settings,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  Info,
  MonetizationOn,
  Loyalty,
  Campaign,
  AutoAwesome,
} from '@mui/icons-material';
import DojoCoinRewardService, {
  DojoCoinReward,
  LoyaltyTier,
  PlayerLoyalty,
  RewardCampaign,
  AutomatedReward,
  RewardRedemption,
} from '../../services/venue/DojoCoinRewardService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rewards-tabpanel-${index}`}
      aria-labelledby={`rewards-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DojoCoinRewards: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [rewards, setRewards] = useState<DojoCoinReward[]>([]);
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>([]);
  const [playerLoyalty, setPlayerLoyalty] = useState<PlayerLoyalty[]>([]);
  const [campaigns, setCampaigns] = useState<RewardCampaign[]>([]);
  const [automatedRewards, setAutomatedRewards] = useState<AutomatedReward[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createRewardDialog, setCreateRewardDialog] = useState(false);
  const [createCampaignDialog, setCreateCampaignDialog] = useState(false);
  const [loyaltyDialog, setLoyaltyDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);

  // Form states
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    coinAmount: 100,
    type: 'daily' as DojoCoinReward['type'],
    maxRedemptions: 100,
  });

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'seasonal' as RewardCampaign['type'],
    targetAudience: 'all' as RewardCampaign['targetAudience'],
  });

  const rewardService = DojoCoinRewardService.getInstance();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data
        const venueRewards = rewardService.getRewards('venue-1');
        const tiers = rewardService.getLoyaltyTiers();
        const analytics = rewardService.getRewardAnalytics('venue-1');

        setRewards(venueRewards);
        setLoyaltyTiers(tiers);
        setAnalytics(analytics);

        // Set up event listeners
        rewardService.on('rewardCreated', (reward: DojoCoinReward) => {
          setRewards(prev => [...prev, reward]);
        });

        rewardService.on('rewardRedeemed', (redemption: RewardRedemption) => {
          setRewards(prev => prev.map(r => 
            r.id === redemption.rewardId 
              ? { ...r, currentRedemptions: r.currentRedemptions + 1 }
              : r
          ));
        });

        rewardService.on('loyaltyUpdated', (loyalty: PlayerLoyalty) => {
          setPlayerLoyalty(prev => {
            const index = prev.findIndex(p => p.playerId === loyalty.playerId);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = loyalty;
              return updated;
            }
            return [...prev, loyalty];
          });
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to load reward data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateReward = async () => {
    try {
      await rewardService.createReward({
        ...newReward,
        conditions: [],
        isActive: true,
        startDate: new Date(),
      });
      setCreateRewardDialog(false);
      setNewReward({ name: '', description: '', coinAmount: 100, type: 'daily', maxRedemptions: 100 });
    } catch (err) {
      setError('Failed to create reward');
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await rewardService.createCampaign({
        ...newCampaign,
        rewards: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      });
      setCreateCampaignDialog(false);
      setNewCampaign({ name: '', description: '', type: 'seasonal', targetAudience: 'all' });
    } catch (err) {
      setError('Failed to create campaign');
    }
  };

  const getRewardTypeColor = (type: DojoCoinReward['type']) => {
    const colors = {
      tournament: '#FF6B6B',
      daily: '#4ECDC4',
      achievement: '#45B7D1',
      special: '#96CEB4',
      loyalty: '#FFEAA7',
      referral: '#DDA0DD',
      milestone: '#98D8C8'
    };
    return colors[type] || '#666';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          color: '#00ff88', 
          textShadow: '0 0 10px #00ff88',
          fontFamily: 'Orbitron, monospace'
        }}>
          Dojo Coin Rewards Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Advanced reward system with loyalty programs, campaigns, and automated distribution
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MonetizationOn sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Rewards</Typography>
                </Box>
                <Typography variant="h4">{analytics.totalRewards}</Typography>
                <Typography variant="body2">Active reward programs</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  <Typography variant="h6">Redemptions</Typography>
                </Box>
                <Typography variant="h4">{analytics.totalRedemptions}</Typography>
                <Typography variant="body2">Total reward redemptions</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="h6">Coins Distributed</Typography>
                </Box>
                <Typography variant="h4">{analytics.totalCoinsDistributed.toLocaleString()}</Typography>
                <Typography variant="body2">Total coins given out</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Loyalty sx={{ mr: 1 }} />
                  <Typography variant="h6">Loyalty Members</Typography>
                </Box>
                <Typography variant="h4">{analytics.loyaltyStats?.totalPlayers || 0}</Typography>
                <Typography variant="body2">Active loyalty program members</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Tabs */}
      <Paper sx={{ width: '100%', background: 'rgba(0, 0, 0, 0.8)' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: '#00ff88',
              '&.Mui-selected': {
                color: '#00ff88',
                textShadow: '0 0 10px #00ff88'
              }
            }
          }}
        >
          <Tab label="Rewards" icon={<EmojiEvents />} />
          <Tab label="Loyalty Program" icon={<Star />} />
          <Tab label="Campaigns" icon={<Campaign />} />
          <Tab label="Automated Rewards" icon={<AutoAwesome />} />
          <Tab label="Analytics" icon={<Analytics />} />
          <Tab label="Settings" icon={<Settings />} />
        </Tabs>

        {/* Rewards Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#00ff88' }}>
              Active Rewards
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateRewardDialog(true)}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #00cc6a)',
                '&:hover': { background: 'linear-gradient(45deg, #00cc6a, #00ff88)' }
              }}
            >
              Create Reward
            </Button>
          </Box>

          <Grid container spacing={3}>
            {rewards.map((reward) => (
              <Grid item xs={12} md={6} lg={4} key={reward.id}>
                <Card sx={{ 
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid #00ff88',
                  '&:hover': { borderColor: '#00cc6a', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#00ff88' }}>
                        {reward.name}
                      </Typography>
                      <Chip
                        label={reward.type}
                        size="small"
                        sx={{
                          backgroundColor: getRewardTypeColor(reward.type),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {reward.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#00ff88' }}>
                        {reward.coinAmount} Coins
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reward.currentRedemptions} / {reward.maxRedemptions || '∞'} redeemed
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={reward.maxRedemptions ? (reward.currentRedemptions / reward.maxRedemptions) * 100 : 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(0, 255, 136, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#00ff88'
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button size="small" startIcon={<Visibility />}>
                        View Details
                      </Button>
                      <Button size="small" startIcon={<Edit />}>
                        Edit
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Loyalty Program Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#00ff88' }}>
              Loyalty Tiers
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setLoyaltyDialog(true)}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #00cc6a)',
                '&:hover': { background: 'linear-gradient(45deg, #00cc6a, #00ff88)' }
              }}
            >
              Add Tier
            </Button>
          </Box>

          <Grid container spacing={3}>
            {loyaltyTiers.map((tier) => (
              <Grid item xs={12} md={4} key={tier.id}>
                <Card sx={{ 
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: `2px solid ${tier.color}`,
                  '&:hover': { boxShadow: `0 0 20px ${tier.color}40` }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h4" sx={{ mr: 1 }}>
                        {tier.icon}
                      </Typography>
                      <Box>
                        <Typography variant="h6" sx={{ color: tier.color }}>
                          {tier.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Level {tier.level}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {tier.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Required Points:</strong> {tier.requiredPoints.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Benefits:</strong>
                    </Typography>
                    <List dense>
                      {tier.benefits.map((benefit, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText
                            primary={benefit.description}
                            sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                          />
                          <Chip
                            label={benefit.type.replace('_', ' ')}
                            size="small"
                            sx={{ backgroundColor: tier.color, color: 'white' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Campaigns Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#00ff88' }}>
              Reward Campaigns
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateCampaignDialog(true)}
              sx={{
                background: 'linear-gradient(45deg, #00ff88, #00cc6a)',
                '&:hover': { background: 'linear-gradient(45deg, #00cc6a, #00ff88)' }
              }}
            >
              Create Campaign
            </Button>
          </Box>

          <Grid container spacing={3}>
            {campaigns.map((campaign) => (
              <Grid item xs={12} md={6} key={campaign.id}>
                <Card sx={{ 
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid #00ff88',
                  '&:hover': { borderColor: '#00cc6a', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff88', mb: 1 }}>
                      {campaign.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {campaign.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label={campaign.type} size="small" />
                      <Chip label={campaign.targetAudience} size="small" />
                      <Chip 
                        label={campaign.isActive ? 'Active' : 'Inactive'} 
                        size="small"
                        color={campaign.isActive ? 'success' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Duration:</strong> {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Rewards:</strong> {campaign.rewards.length} rewards included
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button size="small" startIcon={<Visibility />}>
                        View Details
                      </Button>
                      <Button size="small" startIcon={<Analytics />}>
                        Analytics
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Automated Rewards Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" sx={{ color: '#00ff88', mb: 3 }}>
            Automated Reward Triggers
          </Typography>
          <Grid container spacing={3}>
            {automatedRewards.map((automated) => (
              <Grid item xs={12} md={6} key={automated.id}>
                <Card sx={{ 
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid #00ff88',
                  '&:hover': { borderColor: '#00cc6a', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#00ff88' }}>
                        {automated.name}
                      </Typography>
                      <Switch
                        checked={automated.isActive}
                        color="primary"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00ff88',
                            '&:hover': { backgroundColor: 'rgba(0, 255, 136, 0.08)' }
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#00ff88'
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Trigger: {automated.trigger.type} - {automated.trigger.frequency}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Reward:</strong> {automated.reward.name} ({automated.reward.coinAmount} coins)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Triggered:</strong> {automated.triggerCount} times
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Last Triggered:</strong> {automated.lastTriggered.toLocaleDateString()}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button size="small" startIcon={<Edit />}>
                        Edit Trigger
                      </Button>
                      <Button size="small" startIcon={<Schedule />}>
                        Schedule
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#00ff88' }}>
              Reward Analytics
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setAnalyticsDialog(true)}
              sx={{ borderColor: '#00ff88', color: '#00ff88' }}
            >
              Detailed Analytics
            </Button>
          </Box>

          {analytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ff88' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
                      Top Performing Rewards
                    </Typography>
                    {analytics.topPerformingRewards?.map((reward: DojoCoinReward, index: number) => (
                      <Box key={reward.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {index + 1}. {reward.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#00ff88' }}>
                          {reward.currentRedemptions} redemptions
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ff88' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
                      Loyalty Distribution
                    </Typography>
                    {analytics.loyaltyStats?.tierDistribution?.map((tier: any) => (
                      <Box key={tier.tier} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {tier.tier}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#00ff88' }}>
                          {tier.count} members
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h5" sx={{ color: '#00ff88', mb: 3 }}>
            Reward System Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ff88' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
                    General Settings
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable automated rewards"
                    sx={{ color: 'text.primary' }}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable loyalty program"
                    sx={{ color: 'text.primary' }}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable campaign analytics"
                    sx={{ color: 'text.primary' }}
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Require approval for large rewards"
                    sx={{ color: 'text.primary' }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(0, 0, 0, 0.6)', border: '1px solid #00ff88' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#00ff88', mb: 2 }}>
                    Notification Settings
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Email notifications for redemptions"
                    sx={{ color: 'text.primary' }}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="SMS alerts for high-value rewards"
                    sx={{ color: 'text.primary' }}
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Push notifications for campaigns"
                    sx={{ color: 'text.primary' }}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Weekly analytics reports"
                    sx={{ color: 'text.primary' }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Create Reward Dialog */}
      <Dialog open={createRewardDialog} onClose={() => setCreateRewardDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#00ff88' }}>Create New Reward</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reward Name"
            value={newReward.name}
            onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newReward.description}
            onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Coin Amount"
                type="number"
                value={newReward.coinAmount}
                onChange={(e) => setNewReward({ ...newReward, coinAmount: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Reward Type</InputLabel>
                <Select
                  value={newReward.type}
                  onChange={(e) => setNewReward({ ...newReward, type: e.target.value as DojoCoinReward['type'] })}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="tournament">Tournament</MenuItem>
                  <MenuItem value="achievement">Achievement</MenuItem>
                  <MenuItem value="special">Special</MenuItem>
                  <MenuItem value="loyalty">Loyalty</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRewardDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateReward} variant="contained">Create Reward</Button>
        </DialogActions>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={createCampaignDialog} onClose={() => setCreateCampaignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#00ff88' }}>Create New Campaign</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Campaign Name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newCampaign.description}
            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as RewardCampaign['type'] })}
                >
                  <MenuItem value="seasonal">Seasonal</MenuItem>
                  <MenuItem value="promotional">Promotional</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={newCampaign.targetAudience}
                  onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value as RewardCampaign['targetAudience'] })}
                >
                  <MenuItem value="all">All Players</MenuItem>
                  <MenuItem value="new_players">New Players</MenuItem>
                  <MenuItem value="loyal_players">Loyal Players</MenuItem>
                  <MenuItem value="high_spenders">High Spenders</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCampaignDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCampaign} variant="contained">Create Campaign</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DojoCoinRewards; 