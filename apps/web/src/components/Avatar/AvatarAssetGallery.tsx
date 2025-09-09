'use client';

import { AvatarAsset, AvatarCustomizationData } from '@/types/avatar';
import { CheckCircle, Lock } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface AvatarAssetGalleryProps {
  assets: AvatarAsset[];
  ownedAssets: any[];
  customization: AvatarCustomizationData;
  onCustomizationChange: (customization: AvatarCustomizationData) => void;
  onPurchaseAsset: (assetId: string) => void;
  category: string;
}

export const AvatarAssetGallery: React.FC<AvatarAssetGalleryProps> = ({
  assets,
  ownedAssets,
  customization,
  onCustomizationChange,
  onPurchaseAsset,
  category,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<AvatarAsset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Create a map of owned assets for quick lookup
  const ownedAssetMap = new Map(
    ownedAssets.map((asset) => [asset.assetId, asset])
  );

  const getAssetTypeField = (assetType: string) => {
    switch (assetType) {
      case 'HAIR':
        return 'hair';
      case 'FACE':
        return 'face';
      case 'CLOTHES_TOP':
        return 'clothesTop';
      case 'CLOTHES_BOTTOM':
        return 'clothesBottom';
      case 'SHOES':
        return 'shoes';
      case 'ACCESSORY_HEAD':
        return 'accessoryHead';
      case 'ACCESSORY_NECK':
        return 'accessoryNeck';
      case 'ACCESSORY_BACK':
        return 'accessoryBack';
      case 'WEAPON':
        return 'weapon';
      case 'PET':
        return 'pet';
      case 'EFFECT':
        return 'effect';
      default:
        return '';
    }
  };

  const handleAssetSelect = (asset: AvatarAsset) => {
    const ownedAsset = ownedAssetMap.get(asset.id);

    if (!ownedAsset) {
      // Not owned - show purchase dialog
      setSelectedAsset(asset);
      setPreviewOpen(true);
      return;
    }

    // Owned - toggle equipped status
    const fieldName = getAssetTypeField(asset.type);
    if (!fieldName) return;

    const isCurrentlyEquipped =
      customization[fieldName as keyof AvatarCustomizationData] === asset.id;

    const newCustomization = { ...customization };

    if (isCurrentlyEquipped) {
      // Unequip
      delete newCustomization[fieldName as keyof AvatarCustomizationData];
    } else {
      // Equip
      (newCustomization as any)[fieldName] = asset.id;
    }

    onCustomizationChange(newCustomization);
  };

  const handlePurchaseAsset = () => {
    if (selectedAsset) {
      onPurchaseAsset(selectedAsset.id);
      setPreviewOpen(false);
      setSelectedAsset(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON':
        return '#888';
      case 'UNCOMMON':
        return '#00a8ff';
      case 'RARE':
        return '#ffaa00';
      case 'EPIC':
        return '#ff6b6b';
      case 'LEGENDARY':
        return '#00ff9d';
      default:
        return '#888';
    }
  };

  const getTypeDisplayName = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (assets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
          No {category} items available yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Check back later for new customization options!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ mb: 3, color: '#00ff9d', fontWeight: 'bold' }}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)} Customization
      </Typography>

      <Grid container spacing={2}>
        {assets.map((asset) => {
          const ownedAsset = ownedAssetMap.get(asset.id);
          const isOwned = !!ownedAsset;
          const isEquipped = Object.values(customization).includes(asset.id);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
              <Card
                sx={{
                  background: 'rgba(26, 26, 46, 0.8)',
                  border: isEquipped
                    ? '2px solid #00ff9d'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0, 255, 157, 0.2)',
                    borderColor: isEquipped ? '#00ff9d' : '#00a8ff',
                  },
                  position: 'relative',
                  overflow: 'visible',
                }}
                onClick={() => handleAssetSelect(asset)}
              >
                {/* Rarity indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                  }}
                >
                  <Chip
                    label={asset.rarity}
                    size="small"
                    sx={{
                      backgroundColor: getRarityColor(asset.rarity),
                      color: '#000',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>

                {/* Status indicators */}
                {isEquipped && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 2,
                    }}
                  >
                    <CheckCircle sx={{ color: '#00ff9d', fontSize: 24 }} />
                  </Box>
                )}

                {!isOwned && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      zIndex: 2,
                    }}
                  >
                    <Lock sx={{ color: '#ff6b6b', fontSize: 20 }} />
                  </Box>
                )}

                <CardMedia
                  component="div"
                  sx={{
                    height: 120,
                    background:
                      'linear-gradient(45deg, #1a1a2e 30%, #16213e 90%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {asset.thumbnailUrl ? (
                    <Box
                      component="img"
                      src={asset.thumbnailUrl}
                      alt={asset.name}
                      sx={{
                        width: '80%',
                        height: '80%',
                        objectFit: 'contain',
                        filter: !isOwned
                          ? 'grayscale(100%) brightness(0.5)'
                          : 'none',
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{ color: 'text.secondary', textAlign: 'center' }}
                    >
                      {asset.name}
                    </Typography>
                  )}
                </CardMedia>

                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      mb: 1,
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  >
                    {asset.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 2,
                      fontSize: '0.8rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {asset.description || getTypeDisplayName(asset.type)}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {asset.price > 0 && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#00ff9d',
                            fontWeight: 'bold',
                          }}
                        >
                          {asset.price} 🪙
                        </Typography>
                      </Box>
                    )}

                    <Button
                      size="small"
                      variant={isEquipped ? 'contained' : 'outlined'}
                      sx={{
                        minWidth: 'auto',
                        px: 1,
                        py: 0.5,
                        fontSize: '0.7rem',
                        backgroundColor: isEquipped ? '#00ff9d' : 'transparent',
                        borderColor: isEquipped
                          ? '#00ff9d'
                          : isOwned
                            ? '#00a8ff'
                            : '#ff6b6b',
                        color: isEquipped
                          ? '#000'
                          : isOwned
                            ? '#00a8ff'
                            : '#ff6b6b',
                        '&:hover': {
                          backgroundColor: isEquipped
                            ? '#00cc7a'
                            : 'transparent',
                          borderColor: isEquipped
                            ? '#00cc7a'
                            : isOwned
                              ? '#0088cc'
                              : '#cc5555',
                        },
                      }}
                    >
                      {isEquipped ? 'Equipped' : isOwned ? 'Equip' : 'Buy'}
                    </Button>
                  </Box>

                  {/* Stat bonuses */}
                  {asset.statBonuses &&
                    Object.keys(asset.statBonuses).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', display: 'block' }}
                        >
                          Bonuses:
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap',
                            mt: 0.5,
                          }}
                        >
                          {Object.entries(asset.statBonuses).map(
                            ([stat, value]) => (
                              <Chip
                                key={stat}
                                label={`${stat}: +${value}`}
                                size="small"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: 18,
                                  backgroundColor: 'rgba(255, 170, 0, 0.2)',
                                  color: '#ffaa00',
                                  border: '1px solid #ffaa00',
                                }}
                              />
                            )
                          )}
                        </Box>
                      </Box>
                    )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Purchase Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(26, 26, 46, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#00ff9d', fontWeight: 'bold' }}>
          Purchase Asset
        </DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
                {selectedAsset.name}
              </Typography>

              {selectedAsset.thumbnailUrl && (
                <Box
                  component="img"
                  src={selectedAsset.thumbnailUrl}
                  alt={selectedAsset.name}
                  sx={{
                    width: 120,
                    height: 120,
                    objectFit: 'contain',
                    mb: 2,
                    borderRadius: 1,
                  }}
                />
              )}

              <Typography
                variant="body1"
                sx={{ mb: 2, color: 'text.secondary' }}
              >
                {selectedAsset.description}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Chip
                  label={selectedAsset.rarity}
                  sx={{
                    backgroundColor: getRarityColor(selectedAsset.rarity),
                    color: '#000',
                  }}
                />
                <Chip
                  label={`${selectedAsset.price} 🪙`}
                  sx={{
                    backgroundColor: 'rgba(0, 255, 157, 0.2)',
                    color: '#00ff9d',
                    border: '1px solid #00ff9d',
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setPreviewOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchaseAsset}
            variant="contained"
            sx={{
              backgroundColor: '#00ff9d',
              color: '#000',
              '&:hover': {
                backgroundColor: '#00cc7a',
              },
            }}
          >
            Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
