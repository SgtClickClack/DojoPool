import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  rarity: string;
  imageUrl?: string;
  equipped?: boolean;
}

export interface InventoryItemCardProps {
  item: InventoryItem;
  onEquip?: (itemId: string) => void;
  onUnequip?: (itemId: string) => void;
  showEquipButton?: boolean;
}

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'grey';
    case 'uncommon':
      return 'green';
    case 'rare':
      return 'blue';
    case 'epic':
      return 'purple';
    case 'legendary':
      return 'orange';
    default:
      return 'grey';
  }
};

export const InventoryItemCard: React.FC<InventoryItemCardProps> = React.memo(
  ({ item, onEquip, onUnequip, showEquipButton = true }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleEquip = () => {
      if (item.equipped && onUnequip) {
        onUnequip(item.id);
      } else if (!item.equipped && onEquip) {
        onEquip(item.id);
      }
    };

    return (
      <Card
        sx={{
          maxWidth: 300,
          position: 'relative',
          transition: 'transform 0.2s',
          transform: isHovered ? 'translateY(-4px)' : 'none',
          border: item.equipped ? '2px solid #4caf50' : '1px solid #e0e0e0',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {item.equipped && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <Chip
              label="Equipped"
              size="small"
              color="success"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
        )}

        <CardMedia
          component="img"
          height="140"
          image={item.imageUrl || '/placeholder-item.png'}
          alt={item.name}
          sx={{ objectFit: 'cover' }}
        />

        <CardContent>
          <Typography
            gutterBottom
            variant="h6"
            component="div"
            sx={{ fontSize: '1rem' }}
          >
            {item.name}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Chip
              label={item.rarity}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                borderColor: getRarityColor(item.rarity),
                color: getRarityColor(item.rarity),
              }}
            />
            <Chip
              label={item.type}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>

          {item.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, fontSize: '0.8rem' }}
            >
              {item.description}
            </Typography>
          )}

          {showEquipButton && (onEquip || onUnequip) && (
            <Button
              variant={item.equipped ? 'outlined' : 'contained'}
              color={item.equipped ? 'secondary' : 'primary'}
              size="small"
              onClick={handleEquip}
              fullWidth
            >
              {item.equipped ? 'Unequip' : 'Equip'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

InventoryItemCard.displayName = 'InventoryItemCard';
