import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  LocalOffer as OfferIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import VenueSpecialsService, {
  type VenueSpecial,
  type SpecialUsage,
  type SpecialAnalytics,
  type SpecialsConfig,
} from '../../services/venue/VenueSpecialsService';

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
      id={`specials-tabpanel-${index}`}
      aria-labelledby={`specials-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const VenueSpecials: React.FC = () => {
  const service = VenueSpecialsService.getInstance();
  const [tabValue, setTabValue] = useState(0);
  const [specials, setSpecials] = useState<VenueSpecial[]>([]);
  const [usage, setUsage] = useState<SpecialUsage[]>([]);
  const [analytics, setAnalytics] = useState<SpecialAnalytics[]>([]);
  const [config, setConfig] = useState<SpecialsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSpecial, setSelectedSpecial] = useState<VenueSpecial | null>(
    null
  );
  const [newSpecial, setNewSpecial] = useState<Partial<VenueSpecial>>({
    name: '',
    description: '',
    type: 'happy_hour',
    discountType: 'percentage',
    discountValue: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    applicableItems: [],
    excludedItems: [],
    customerGroups: 'all',
    status: 'active',
    priority: 1,
    autoActivate: true,
    conditions: [],
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [specialsData, usageData, analyticsData, configData] =
        await Promise.all([
          Promise.resolve(service.getSpecials()),
          Promise.resolve(service.getUsage()),
          Promise.resolve(service.getAnalytics()),
          Promise.resolve(service.getConfig()),
        ]);

      setSpecials(specialsData);
      setUsage(usageData);
      setAnalytics(analyticsData);
      setConfig(configData);
      setError(null);
    } catch (err) {
      setError('Failed to load venue specials data');
      console.error('Error loading venue specials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpecial = async () => {
    try {
      await service.createSpecial(
        newSpecial as Omit<
          VenueSpecial,
          'id' | 'currentUsage' | 'createdAt' | 'updatedAt'
        >
      );
      setCreateDialogOpen(false);
      setNewSpecial({
        name: '',
        description: '',
        type: 'happy_hour',
        discountType: 'percentage',
        discountValue: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        applicableItems: [],
        excludedItems: [],
        customerGroups: 'all',
        status: 'active',
        priority: 1,
        autoActivate: true,
        conditions: [],
      });
      loadData();
    } catch (err) {
      setError('Failed to create special');
      console.error('Error creating special:', err);
    }
  };

  const handleEditSpecial = async () => {
    if (!selectedSpecial) return;
    try {
      await service.updateSpecial(selectedSpecial.id, newSpecial);
      setEditDialogOpen(false);
      setSelectedSpecial(null);
      loadData();
    } catch (err) {
      setError('Failed to update special');
      console.error('Error updating special:', err);
    }
  };

  const handleDeleteSpecial = async (specialId: string) => {
    try {
      await service.deleteSpecial(specialId);
      loadData();
    } catch (err) {
      setError('Failed to delete special');
      console.error('Error deleting special:', err);
    }
  };

  const getSpecialTypeIcon = (type: VenueSpecial['type']) => {
    switch (type) {
      case 'happy_hour':
        return <TimeIcon />;
      case 'tournament_day':
        return <EventIcon />;
      case 'member_exclusive':
        return <StarIcon />;
      case 'seasonal':
        return <TrendingUpIcon />;
      case 'special_event':
        return <OfferIcon />;
      default:
        return <LocalOffer />;
    }
  };

  const getSpecialTypeColor = (type: VenueSpecial['type']) => {
    switch (type) {
      case 'happy_hour':
        return 'primary';
      case 'tournament_day':
        return 'secondary';
      case 'member_exclusive':
        return 'warning';
      case 'seasonal':
        return 'success';
      case 'special_event':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: VenueSpecial['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'scheduled':
        return 'warning';
      case 'expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDiscount = (special: VenueSpecial) => {
    switch (special.discountType) {
      case 'percentage':
        return `${special.discountValue}% off`;
      case 'fixed_amount':
        return `$${special.discountValue} off`;
      case 'free_item':
        return `Free item`;
      case 'buy_one_get_one':
        return 'Buy 1 Get 1';
      default:
        return 'Discount';
    }
  };

  const getActiveSpecialsCount = () =>
    specials.filter((s) => s.status === 'active').length;

  const getTotalUsage = () => usage.length;

  const getTotalDiscount = () =>
    usage.reduce((sum, u) => sum + u.discountApplied, 0);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <LocalOffer sx={{ color: 'primary.main' }} />
        Venue Specials Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Specials
              </Typography>
              <Typography variant="h4" component="div">
                {getActiveSpecialsCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Currently running promotions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Usage
              </Typography>
              <Typography variant="h4" component="div">
                {getTotalUsage()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Times specials were used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Discount
              </Typography>
              <Typography variant="h4" component="div">
                ${getTotalDiscount().toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Value of discounts given
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h4" component="div">
                {specials.length > 0
                  ? ((getTotalUsage() / specials.length) * 100).toFixed(1)
                  : 0}
                %
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Usage per special
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="venue specials tabs"
        >
          <Tab label="Active Specials" />
          <Tab label="All Specials" />
          <Tab label="Usage Analytics" />
          <Tab label="Configuration" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Active Specials</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Special
            </Button>
          </Box>
          <Grid container spacing={2}>
            {specials
              .filter((special) => special.status === 'active')
              .map((special) => (
                <Grid item xs={12} md={6} lg={4} key={special.id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {getSpecialTypeIcon(special.type)}
                          <Typography variant="h6" component="div">
                            {special.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={special.status}
                          color={getStatusColor(special.status)}
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 2 }}
                      >
                        {special.description}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          mb: 2,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Chip
                          label={formatDiscount(special)}
                          color={getSpecialTypeColor(special.type)}
                          size="small"
                        />
                        <Chip
                          label={`Priority: ${special.priority}`}
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          label={`Used: ${special.currentUsage}`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(special.startDate).toLocaleDateString()} -{' '}
                        {new Date(special.endDate).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setSelectedSpecial(special);
                          setNewSpecial(special);
                          setEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteSpecial(special.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">All Specials</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Special
            </Button>
          </Box>
          <List>
            {specials.map((special) => (
              <React.Fragment key={special.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {getSpecialTypeIcon(special.type)}
                        <Typography variant="subtitle1">
                          {special.name}
                        </Typography>
                        <Chip
                          label={special.status}
                          color={getStatusColor(special.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {special.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={formatDiscount(special)}
                            color={getSpecialTypeColor(special.type)}
                            size="small"
                          />
                          <Chip
                            label={`Used: ${special.currentUsage}`}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setSelectedSpecial(special);
                        setNewSpecial(special);
                        setEditDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleDeleteSpecial(special.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Usage Analytics
          </Typography>
          <Grid container spacing={3}>
            {analytics.map((analytic) => {
              const special = specials.find((s) => s.id === analytic.specialId);
              return (
                <Grid item xs={12} md={6} key={analytic.specialId}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {special?.name || 'Unknown Special'}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Total Usage
                          </Typography>
                          <Typography variant="h6">
                            {analytic.totalUsage}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Total Discount
                          </Typography>
                          <Typography variant="h6">
                            ${analytic.totalDiscount.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Conversion Rate
                          </Typography>
                          <Typography variant="h6">
                            {analytic.conversionRate.toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Customer Satisfaction
                          </Typography>
                          <Typography variant="h6">
                            {analytic.customerSatisfaction.toFixed(0)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Configuration
          </Typography>
          {config && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      General Settings
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.autoActivation}
                          onChange={(e) => {
                            service.updateConfig({
                              autoActivation: e.target.checked,
                            });
                            setConfig({
                              ...config,
                              autoActivation: e.target.checked,
                            });
                          }}
                        />
                      }
                      label="Auto-activation"
                    />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Conflict Resolution</InputLabel>
                      <Select
                        value={config.conflictResolution}
                        label="Conflict Resolution"
                        onChange={(e) => {
                          service.updateConfig({
                            conflictResolution: e.target.value as any,
                          });
                          setConfig({
                            ...config,
                            conflictResolution: e.target.value as any,
                          });
                        }}
                      >
                        <MenuItem value="priority">Priority</MenuItem>
                        <MenuItem value="first_created">First Created</MenuItem>
                        <MenuItem value="highest_discount">
                          Highest Discount
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Max Active Specials"
                      type="number"
                      value={config.maxActiveSpecials}
                      onChange={(e) => {
                        service.updateConfig({
                          maxActiveSpecials: parseInt(e.target.value),
                        });
                        setConfig({
                          ...config,
                          maxActiveSpecials: parseInt(e.target.value),
                        });
                      }}
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Notification Settings
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notificationSettings.email}
                          onChange={(e) => {
                            service.updateConfig({
                              notificationSettings: {
                                ...config.notificationSettings,
                                email: e.target.checked,
                              },
                            });
                            setConfig({
                              ...config,
                              notificationSettings: {
                                ...config.notificationSettings,
                                email: e.target.checked,
                              },
                            });
                          }}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notificationSettings.push}
                          onChange={(e) => {
                            service.updateConfig({
                              notificationSettings: {
                                ...config.notificationSettings,
                                push: e.target.checked,
                              },
                            });
                            setConfig({
                              ...config,
                              notificationSettings: {
                                ...config.notificationSettings,
                                push: e.target.checked,
                              },
                            });
                          }}
                        />
                      }
                      label="Push Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.notificationSettings.inApp}
                          onChange={(e) => {
                            service.updateConfig({
                              notificationSettings: {
                                ...config.notificationSettings,
                                inApp: e.target.checked,
                              },
                            });
                            setConfig({
                              ...config,
                              notificationSettings: {
                                ...config.notificationSettings,
                                inApp: e.target.checked,
                              },
                            });
                          }}
                        />
                      }
                      label="In-App Notifications"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Create Special Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Special</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Special Name"
                value={newSpecial.name}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newSpecial.type}
                  label="Type"
                  onChange={(e) =>
                    setNewSpecial({
                      ...newSpecial,
                      type: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="happy_hour">Happy Hour</MenuItem>
                  <MenuItem value="tournament_day">Tournament Day</MenuItem>
                  <MenuItem value="member_exclusive">Member Exclusive</MenuItem>
                  <MenuItem value="seasonal">Seasonal</MenuItem>
                  <MenuItem value="special_event">Special Event</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newSpecial.description}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={newSpecial.discountType}
                  label="Discount Type"
                  onChange={(e) =>
                    setNewSpecial({
                      ...newSpecial,
                      discountType: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                  <MenuItem value="free_item">Free Item</MenuItem>
                  <MenuItem value="buy_one_get_one">Buy 1 Get 1</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Discount Value"
                type="number"
                value={newSpecial.discountValue}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    discountValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newSpecial.startDate?.toISOString().split('T')[0]}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    startDate: new Date(e.target.value),
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={newSpecial.endDate?.toISOString().split('T')[0]}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    endDate: new Date(e.target.value),
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time (HH:MM)"
                value={newSpecial.startTime || ''}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, startTime: e.target.value })
                }
                placeholder="17:00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Time (HH:MM)"
                value={newSpecial.endTime || ''}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, endTime: e.target.value })
                }
                placeholder="19:00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={newSpecial.priority}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    priority: parseInt(e.target.value) || 1,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer Groups</InputLabel>
                <Select
                  value={newSpecial.customerGroups}
                  label="Customer Groups"
                  onChange={(e) =>
                    setNewSpecial({
                      ...newSpecial,
                      customerGroups: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="all">All Customers</MenuItem>
                  <MenuItem value="members">Members Only</MenuItem>
                  <MenuItem value="new_customers">New Customers</MenuItem>
                  <MenuItem value="returning_customers">
                    Returning Customers
                  </MenuItem>
                  <MenuItem value="vip">VIP Customers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSpecial.autoActivate}
                    onChange={(e) =>
                      setNewSpecial({
                        ...newSpecial,
                        autoActivate: e.target.checked,
                      })
                    }
                  />
                }
                label="Auto-activate"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSpecial} variant="contained">
            Create Special
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Special Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Special</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Special Name"
                value={newSpecial.name}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newSpecial.type}
                  label="Type"
                  onChange={(e) =>
                    setNewSpecial({
                      ...newSpecial,
                      type: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="happy_hour">Happy Hour</MenuItem>
                  <MenuItem value="tournament_day">Tournament Day</MenuItem>
                  <MenuItem value="member_exclusive">Member Exclusive</MenuItem>
                  <MenuItem value="seasonal">Seasonal</MenuItem>
                  <MenuItem value="special_event">Special Event</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newSpecial.description}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={newSpecial.discountType}
                  label="Discount Type"
                  onChange={(e) =>
                    setNewSpecial({
                      ...newSpecial,
                      discountType: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                  <MenuItem value="free_item">Free Item</MenuItem>
                  <MenuItem value="buy_one_get_one">Buy 1 Get 1</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Discount Value"
                type="number"
                value={newSpecial.discountValue}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    discountValue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newSpecial.startDate?.toISOString().split('T')[0]}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    startDate: new Date(e.target.value),
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={newSpecial.endDate?.toISOString().split('T')[0]}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    endDate: new Date(e.target.value),
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time (HH:MM)"
                value={newSpecial.startTime || ''}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, startTime: e.target.value })
                }
                placeholder="17:00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Time (HH:MM)"
                value={newSpecial.endTime || ''}
                onChange={(e) =>
                  setNewSpecial({ ...newSpecial, endTime: e.target.value })
                }
                placeholder="19:00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={newSpecial.priority}
                onChange={(e) =>
                  setNewSpecial({
                    ...newSpecial,
                    priority: parseInt(e.target.value) || 1,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer Groups</InputLabel>
                <Select
                  value={newSpecial.customerGroups}
                  label="Customer Groups"
                  onChange={(e) =>
                    setNewSpecial({
                      ...newSpecial,
                      customerGroups: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="all">All Customers</MenuItem>
                  <MenuItem value="members">Members Only</MenuItem>
                  <MenuItem value="new_customers">New Customers</MenuItem>
                  <MenuItem value="returning_customers">
                    Returning Customers
                  </MenuItem>
                  <MenuItem value="vip">VIP Customers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSpecial.autoActivate}
                    onChange={(e) =>
                      setNewSpecial({
                        ...newSpecial,
                        autoActivate: e.target.checked,
                      })
                    }
                  />
                }
                label="Auto-activate"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSpecial} variant="contained">
            Update Special
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VenueSpecials;
