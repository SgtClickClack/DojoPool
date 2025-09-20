import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import { type EquipmentSlot } from '@/types/inventory';

export interface LoadoutItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  imageUrl?: string;
}

export interface LoadoutDisplayProps {
  loadout: {
    [key: string]: LoadoutItem | null;
  };
  slotNames?: { [key: string]: string };
  user?: { id: string; username?: string } | null;
  equipping?: string | null;
  onEquipItem?: (itemId: string, equipmentSlot: string) => Promise<void>;
  onUnequipItem?: (equipmentSlot: string) => Promise<void>;
}

export const LoadoutDisplay: React.FC<LoadoutDisplayProps> = ({
  loadout,
  slotNames = {},
  user: _user,
  equipping: _equipping,
  onEquipItem: _onEquipItem,
  onUnequipItem: _onUnequipItem,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Current Loadout
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Object.entries(loadout).map(([slot, item]) => (
            <Box key={slot} sx={{ textAlign: 'center', minWidth: '120px' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {slotNames[slot] || slot}
              </Typography>

              <Card
                variant="outlined"
                sx={{
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                }}
              >
                {item ? (
                  <Avatar
                    src={item.imageUrl}
                    alt={item.name}
                    sx={{ width: 60, height: 60 }}
                  >
                    {item.name.charAt(0)}
                  </Avatar>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Empty
                  </Typography>
                )}
              </Card>

              {item && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '0.75rem', mb: 0.5 }}
                  >
                    {item.name}
                  </Typography>
                  <Chip
                    label={item.rarity}
                    size="small"
                    color={
                      item.rarity === 'legendary'
                        ? 'warning'
                        : item.rarity === 'epic'
                          ? 'secondary'
                          : item.rarity === 'rare'
                            ? 'primary'
                            : 'default'
                    }
                    sx={{ fontSize: '0.6rem', height: '20px' }}
                  />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};
