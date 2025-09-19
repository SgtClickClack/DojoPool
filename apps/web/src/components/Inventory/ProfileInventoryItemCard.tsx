import { type UserInventoryItem } from '@/services/marketplaceService';
import { Cancel, CheckCircle } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Typography,
} from '@mui/material';

interface ProfileInventoryItemCardProps {
  item: UserInventoryItem;
  onEquipItem: (item: UserInventoryItem) => void;
}

export const ProfileInventoryItemCard: React.FC<
  ProfileInventoryItemCardProps
> = ({ item, onEquipItem }) => {
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary':
        return '#ffd700';
      case 'epic':
        return '#a335ee';
      case 'rare':
        return '#0070dd';
      default:
        return '#ffffff';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'avatar':
        return '👤';
      case 'cue':
        return '🎱';
      case 'table':
        return '🏓';
      case 'emote':
        return '😊';
      case 'title':
        return '🏆';
      default:
        return '📦';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: item.equipped ? '2px solid #4caf50' : '1px solid #e0e0e0',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={item.image}
          alt={item.name}
          sx={{ objectFit: 'cover' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDExOSAxMTEuNDU3IDExOSAxMDFDMTE5IDkwLjU0MzUgMTEwLjQ1NyA4MiAxMDAgODJDODkuNTQzNSA4MiA4MSA5MC41NDM1IDgxIDEwMUM4MSAxMTEuNDU3IDg5LjU0MzUgMTIwIDEwMCAxMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzExMC40NTcgMTQwIDExOSAxMzEuNDU3IDExOSAxMjFDMTE5IDExMC41NDQgMTEwLjQ1NyAxMDIgMTAwIDEwMkM4OS41NDM1IDEwMiA4MSAxMTAuNTQ0IDgxIDEyMUM4MSAxMzEuNDU3IDg5LjU0MzUgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
          }}
        />

        {/* Rarity Badge */}
        <Chip
          label={item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: getRarityColor(item.rarity),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem',
          }}
        />

        {/* Equipped Badge */}
        {item.equipped && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#4caf50',
              color: 'white',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle fontSize="small" />
          </Box>
        )}
      </Box>

      <CardContent
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {item.name}
          </Typography>
          <Typography variant="h5">{getTypeIcon(item.type)}</Typography>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, flexGrow: 1 }}
        >
          {item.description}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Chip
            label={item.category}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />
          <Typography variant="caption" color="text.secondary">
            {new Date(item.acquiredAt).toLocaleDateString()}
          </Typography>
        </Box>

        <Button
          variant={item.equipped ? 'outlined' : 'contained'}
          color={item.equipped ? 'success' : 'primary'}
          fullWidth
          onClick={() => onEquipItem(item)}
          startIcon={item.equipped ? <CheckCircle /> : <Cancel />}
        >
          {item.equipped ? 'Equipped' : 'Equip'}
        </Button>
      </CardContent>
    </Card>
  );
};
