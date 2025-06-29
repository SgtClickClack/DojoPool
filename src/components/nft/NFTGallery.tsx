import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Badge,
  Skeleton,
  Alert,
  Stack
} from '@mui/material';
import {
  FilterList,
  Sort,
  ViewModule,
  ViewList,
  Info,
  Share,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { useNFTWallet } from '../../hooks/useNFTWallet';
import { TrophyInfo } from '../../services/wallet/NFTWalletService';

interface NFTGalleryProps {
  userId?: string;
  showConnectButton?: boolean;
  onTrophySelect?: (trophy: TrophyInfo) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'mintedAt' | 'rarity' | 'name' | 'type';
type SortOrder = 'asc' | 'desc';

const rarityColors = {
  Common: '#9E9E9E',
  Uncommon: '#4CAF50',
  Rare: '#2196F3',
  Epic: '#9C27B0',
  Legendary: '#FF9800',
  Mythic: '#F44336'
};

const rarityOrder = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Mythic: 5
};

export const NFTGallery: React.FC<NFTGalleryProps> = ({
  userId,
  showConnectButton = true,
  onTrophySelect
}) => {
  const {
    isConnected,
    userTrophies,
    isLoading,
    error,
    connectMetaMask,
    refreshTrophies
  } = useNFTWallet();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('mintedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyInfo | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filter and sort trophies
  const filteredAndSortedTrophies = React.useMemo(() => {
    let filtered = userTrophies.filter(trophy => {
      const matchesRarity = filterRarity === 'all' || trophy.rarity === filterRarity;
      const matchesType = filterType === 'all' || trophy.trophyType === filterType;
      const matchesSearch = trophy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           trophy.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesRarity && matchesType && matchesSearch;
    });

    // Sort trophies
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'mintedAt':
          comparison = new Date(a.mintedAt).getTime() - new Date(b.mintedAt).getTime();
          break;
        case 'rarity':
          comparison = rarityOrder[a.rarity as keyof typeof rarityOrder] - rarityOrder[b.rarity as keyof typeof rarityOrder];
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.trophyType.localeCompare(b.trophyType);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [userTrophies, filterRarity, filterType, searchQuery, sortBy, sortOrder]);

  // Handle trophy selection
  const handleTrophyClick = (trophy: TrophyInfo) => {
    setSelectedTrophy(trophy);
    onTrophySelect?.(trophy);
  };

  // Handle favorite toggle
  const toggleFavorite = (tokenId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(tokenId)) {
      newFavorites.delete(tokenId);
    } else {
      newFavorites.add(tokenId);
    }
    setFavorites(newFavorites);
  };

  // Handle share trophy
  const handleShare = (trophy: TrophyInfo) => {
    if (navigator.share) {
      navigator.share({
        title: trophy.name,
        text: trophy.description,
        url: `${window.location.origin}/nft/${trophy.tokenId}`
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/nft/${trophy.tokenId}`);
    }
  };

  // Render trophy card
  const renderTrophyCard = (trophy: TrophyInfo) => (
    <Card
      key={trophy.tokenId}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={() => handleTrophyClick(trophy)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height={viewMode === 'grid' ? 200 : 120}
          image={trophy.imageURI || '/images/default-trophy.png'}
          alt={trophy.name}
          sx={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(trophy.tokenId);
            }}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
          >
            {favorites.has(trophy.tokenId) ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleShare(trophy);
            }}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
          >
            <Share />
          </IconButton>
        </Box>
        <Chip
          label={trophy.rarity}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: rarityColors[trophy.rarity as keyof typeof rarityColors],
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="h3" gutterBottom noWrap>
          {trophy.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
          {trophy.description}
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
          <Chip
            label={trophy.trophyType}
            size="small"
            variant="outlined"
          />
          {!trophy.isTransferable && (
            <Chip
              label="Non-transferable"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Stack>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Minted: {new Date(trophy.mintedAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );

  // Render trophy list item
  const renderTrophyListItem = (trophy: TrophyInfo) => (
    <Card
      key={trophy.tokenId}
      sx={{
        display: 'flex',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateX(4px)',
          boxShadow: 2
        }
      }}
      onClick={() => handleTrophyClick(trophy)}
    >
      <CardMedia
        component="img"
        sx={{ width: 120, height: 120 }}
        image={trophy.imageURI || '/images/default-trophy.png'}
        alt={trophy.name}
      />
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            {trophy.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {trophy.description}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={trophy.rarity}
              size="small"
              sx={{
                backgroundColor: rarityColors[trophy.rarity as keyof typeof rarityColors],
                color: 'white'
              }}
            />
            <Chip label={trophy.trophyType} size="small" variant="outlined" />
          </Stack>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(trophy.tokenId);
            }}
          >
            {favorites.has(trophy.tokenId) ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleShare(trophy);
            }}
          >
            <Share />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  if (!isConnected && showConnectButton) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Connect Your Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Connect your wallet to view your DojoPool trophies and achievements.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={connectMetaMask}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect MetaMask'}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Trophies
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {filteredAndSortedTrophies.length} of {userTrophies.length} trophies
        </Typography>
      </Box>

      {/* Filters and Controls */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search trophies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Rarity</InputLabel>
              <Select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                label="Rarity"
              >
                <MenuItem value="all">All Rarities</MenuItem>
                <MenuItem value="Common">Common</MenuItem>
                <MenuItem value="Uncommon">Uncommon</MenuItem>
                <MenuItem value="Rare">Rare</MenuItem>
                <MenuItem value="Epic">Epic</MenuItem>
                <MenuItem value="Legendary">Legendary</MenuItem>
                <MenuItem value="Mythic">Mythic</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Territory Ownership">Territory</MenuItem>
                <MenuItem value="Tournament Winner">Tournament</MenuItem>
                <MenuItem value="Achievement">Achievement</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                label="Sort By"
              >
                <MenuItem value="mintedAt">Date Minted</MenuItem>
                <MenuItem value="rarity">Rarity</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="type">Type</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={3} md={1}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <Sort sx={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
            </Button>
          </Grid>
          
          <Grid item xs={6} sm={3} md={1}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
            </Button>
          </Grid>
          
          <Grid item xs={6} sm={3} md={1}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={refreshTrophies}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Trophies Grid/List */}
      {isLoading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          ))}
        </Grid>
      ) : filteredAndSortedTrophies.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No trophies found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || filterRarity !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Start playing to earn your first trophy!'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredAndSortedTrophies.map(trophy =>
            viewMode === 'grid' ? (
              <Grid item xs={12} sm={6} md={4} lg={3} key={trophy.tokenId}>
                {renderTrophyCard(trophy)}
              </Grid>
            ) : (
              <Grid item xs={12} key={trophy.tokenId}>
                {renderTrophyListItem(trophy)}
              </Grid>
            )
          )}
        </Grid>
      )}

      {/* Trophy Detail Dialog */}
      <Dialog
        open={!!selectedTrophy}
        onClose={() => setSelectedTrophy(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedTrophy && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedTrophy.name}
                <Chip
                  label={selectedTrophy.rarity}
                  size="small"
                  sx={{
                    backgroundColor: rarityColors[selectedTrophy.rarity as keyof typeof rarityColors],
                    color: 'white'
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <img
                    src={selectedTrophy.imageURI || '/images/default-trophy.png'}
                    alt={selectedTrophy.name}
                    style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedTrophy.description}
                  </Typography>
                  
                  <Typography variant="h6" gutterBottom>
                    Details
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Type:</strong> {selectedTrophy.trophyType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Minted:</strong> {new Date(selectedTrophy.mintedAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Transferable:</strong> {selectedTrophy.isTransferable ? 'Yes' : 'No'}
                    </Typography>
                    {selectedTrophy.territoryId && (
                      <Typography variant="body2">
                        <strong>Territory ID:</strong> {selectedTrophy.territoryId}
                      </Typography>
                    )}
                    {selectedTrophy.achievementId && (
                      <Typography variant="body2">
                        <strong>Achievement ID:</strong> {selectedTrophy.achievementId}
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTrophy(null)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleShare(selectedTrophy);
                  setSelectedTrophy(null);
                }}
              >
                Share
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}; 