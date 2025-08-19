import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Palette as CustomizeIcon,
  Inventory as InventoryIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  ShoppingCart as ShopIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { useDojoCustomization } from '../../../hooks/useDojoCustomization';
import {
  CustomizationItem,
  DojoCustomization,
} from '../../../types/dojoCustomization';

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
      id={`customization-tabpanel-${index}`}
      aria-labelledby={`customization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `customization-tab-${index}`,
    'aria-controls': `customization-tabpanel-${index}`,
  };
}

const DojoCustomizationPage: React.FC = () => {
  const router = useRouter();
  const { id: dojoId } = router.query;
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<CustomizationItem | null>(
    null
  );
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const {
    customizations,
    availableItems,
    stats,
    loading,
    error,
    unlockCustomization,
    applyCustomization,
    removeCustomization,
    getItemsByType,
    getItemsByCategory,
    searchItems,
  } = useDojoCustomization(dojoId as string);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchItems(query);
    }
  };

  const filteredItems = useMemo(() => {
    let items = availableItems;

    // Filter by type
    if (selectedType !== 'ALL') {
      items = items.filter((item) => item.type === selectedType);
    }

    // Filter by category
    if (selectedCategory !== 'ALL') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [availableItems, selectedType, selectedCategory, searchQuery]);

  const handleUnlockItem = async (item: CustomizationItem) => {
    setSelectedItem(item);
    setIsUnlockDialogOpen(true);
  };

  const confirmUnlock = async () => {
    if (!selectedItem || !dojoId) return;

    try {
      setIsUnlocking(true);
      await unlockCustomization({
        customizationItemId: selectedItem.id,
        isApplied: false,
      });
      setIsUnlockDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to unlock item:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleApplyCustomization = async (customization: DojoCustomization) => {
    try {
      await applyCustomization(customization.id, !customization.isApplied);
    } catch (err) {
      console.error('Failed to apply customization:', err);
    }
  };

  const handleRemoveCustomization = async (
    customization: DojoCustomization
  ) => {
    try {
      await removeCustomization(customization.id);
    } catch (err) {
      console.error('Failed to remove customization:', err);
    }
  };

  const getRarityColor = (rarity: number) => {
    if (rarity <= 0.1) return 'error';
    if (rarity <= 0.25) return 'warning';
    if (rarity <= 0.5) return 'info';
    return 'default';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'LEGENDARY':
        return 'error';
      case 'PREMIUM':
        return 'warning';
      case 'EVENT':
        return 'secondary';
      case 'SEASONAL':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        <CustomizeIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Dojo Customization
      </Typography>

      {/* Stats Overview */}
      {stats && (
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Typography variant="h6" color="primary">
                  {stats.totalUnlocked}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Items Unlocked
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="h6" color="success.main">
                  {stats.totalApplied}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently Applied
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="h6" color="info.main">
                  {stats.customizationLevel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customization Level
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="h6" color="warning.main">
                  {stats.availableSlots - stats.totalApplied}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Slots
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="customization tabs"
          >
            <Tab icon={<ShopIcon />} label="Item Browser" {...a11yProps(0)} />
            <Tab
              icon={<InventoryIcon />}
              label={`My Inventory (${customizations.length})`}
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        {/* Item Browser Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search customization items..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    label="Type"
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <MenuItem value="ALL">All Types</MenuItem>
                    <MenuItem value="FLOOR">Floor</MenuItem>
                    <MenuItem value="WALL">Wall</MenuItem>
                    <MenuItem value="DECORATION">Decoration</MenuItem>
                    <MenuItem value="LIGHTING">Lighting</MenuItem>
                    <MenuItem value="SOUND">Sound</MenuItem>
                    <MenuItem value="FURNITURE">Furniture</MenuItem>
                    <MenuItem value="ARTWORK">Artwork</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="ALL">All Categories</MenuItem>
                    <MenuItem value="BASIC">Basic</MenuItem>
                    <MenuItem value="PREMIUM">Premium</MenuItem>
                    <MenuItem value="LEGENDARY">Legendary</MenuItem>
                    <MenuItem value="EVENT">Event</MenuItem>
                    <MenuItem value="SEASONAL">Seasonal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Items Grid */}
          <Grid container spacing={3}>
            {filteredItems.map((item) => {
              const isUnlocked = customizations.some(
                (c) => c.customizationItem.id === item.id
              );

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: isUnlocked ? 'default' : 'pointer',
                      opacity: isUnlocked ? 0.6 : 1,
                      '&:hover': isUnlocked ? {} : { transform: 'scale(1.02)' },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={() => !isUnlocked && handleUnlockItem(item)}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={
                        item.imageUrl || '/images/placeholder-customization.jpg'
                      }
                      alt={item.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" component="h3" noWrap>
                          {item.name}
                        </Typography>
                        <Chip
                          label={item.category}
                          size="small"
                          color={getCategoryColor(item.category) as any}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {item.description || 'No description available'}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Chip
                          icon={<StarIcon />}
                          label={`${(item.rarity * 100).toFixed(1)}%`}
                          size="small"
                          color={getRarityColor(item.rarity) as any}
                        />
                        <Typography variant="body2" color="primary">
                          {item.unlockCost} Coins
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      {isUnlocked ? (
                        <Chip label="Unlocked" color="success" size="small" />
                      ) : (
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          variant="contained"
                          fullWidth
                        >
                          Unlock
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {filteredItems.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No customization items found matching your criteria.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* My Inventory Tab */}
        <TabPanel value={tabValue} index={1}>
          {customizations.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You haven't unlocked any customization items yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse the Item Browser to unlock items for your dojo!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {customizations.map((customization) => (
                <Grid item xs={12} sm={6} md={4} key={customization.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={
                        customization.customizationItem.imageUrl ||
                        '/images/placeholder-customization.jpg'
                      }
                      alt={customization.customizationItem.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" component="h3">
                          {customization.customizationItem.name}
                        </Typography>
                        <Chip
                          label={customization.customizationItem.type}
                          size="small"
                          color="primary"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {customization.customizationItem.description ||
                          'No description available'}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Unlocked:{' '}
                          {new Date(
                            customization.unlockedAt
                          ).toLocaleDateString()}
                        </Typography>
                        {customization.isApplied && (
                          <Chip label="Applied" color="success" size="small" />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={
                          customization.isApplied ? (
                            <RemoveIcon />
                          ) : (
                            <CheckIcon />
                          )
                        }
                        variant={
                          customization.isApplied ? 'outlined' : 'contained'
                        }
                        color={customization.isApplied ? 'error' : 'success'}
                        onClick={() => handleApplyCustomization(customization)}
                        sx={{ flex: 1, mr: 1 }}
                      >
                        {customization.isApplied ? 'Remove' : 'Apply'}
                      </Button>
                      <Tooltip title="Remove from inventory">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleRemoveCustomization(customization)
                          }
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Card>

      {/* Unlock Confirmation Dialog */}
      <Dialog
        open={isUnlockDialogOpen}
        onClose={() => setIsUnlockDialogOpen(false)}
      >
        <DialogTitle>Unlock Customization Item</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to unlock{' '}
                <strong>{selectedItem.name}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This will cost{' '}
                <strong>{selectedItem.unlockCost} Dojo Coins</strong>.
              </Typography>
              {selectedItem.description && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {selectedItem.description}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsUnlockDialogOpen(false)}
            disabled={isUnlocking}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmUnlock}
            variant="contained"
            disabled={isUnlocking}
            startIcon={
              isUnlocking ? <CircularProgress size={20} /> : <AddIcon />
            }
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DojoCustomizationPage;
