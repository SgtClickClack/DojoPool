import { Refresh } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import React from 'react';

import { ItemRarity, ItemType } from '@/types/inventory';
import { useInventory } from './InventoryDataProvider';

export const InventoryFilters: React.FC = () => {
  const {
    searchQuery,
    selectedType,
    selectedRarity,
    showOwnedOnly,
    setSearchQuery,
    setSelectedType,
    setSelectedRarity,
    setShowOwnedOnly,
    refreshData,
  } = useInventory();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType(event.target.value as ItemType | 'ALL');
  };

  const handleRarityChange = (event: SelectChangeEvent<string>) => {
    setSelectedRarity(event.target.value as ItemRarity | 'ALL');
  };

  const handleOwnedOnlyChange = (event: SelectChangeEvent<string>) => {
    setShowOwnedOnly(event.target.value === 'owned');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedRarity('ALL');
    setShowOwnedOnly(false);
  };

  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
      }}
    >
      <TextField
        label="Search items"
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={handleSearchChange}
        sx={{ minWidth: 200 }}
      />

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Type</InputLabel>
        <Select value={selectedType} label="Type" onChange={handleTypeChange}>
          <MenuItem value="ALL">All Types</MenuItem>
          <MenuItem value="CUE">Cues</MenuItem>
          <MenuItem value="BALL_SET">Ball Sets</MenuItem>
          <MenuItem value="TABLE_THEME">Table Themes</MenuItem>
          <MenuItem value="AVATAR_FRAME">Avatar Frames</MenuItem>
          <MenuItem value="PROFILE_BADGE">Profile Badges</MenuItem>
          <MenuItem value="TITLE">Titles</MenuItem>
          <MenuItem value="EMOTE">Emotes</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Rarity</InputLabel>
        <Select
          value={selectedRarity}
          label="Rarity"
          onChange={handleRarityChange}
        >
          <MenuItem value="ALL">All Rarities</MenuItem>
          <MenuItem value="COMMON">Common</MenuItem>
          <MenuItem value="UNCOMMON">Uncommon</MenuItem>
          <MenuItem value="RARE">Rare</MenuItem>
          <MenuItem value="EPIC">Epic</MenuItem>
          <MenuItem value="LEGENDARY">Legendary</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Ownership</InputLabel>
        <Select
          value={showOwnedOnly ? 'owned' : 'all'}
          label="Ownership"
          onChange={handleOwnedOnlyChange}
        >
          <MenuItem value="all">All Items</MenuItem>
          <MenuItem value="owned">Owned Only</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        startIcon={<Refresh />}
        onClick={refreshData}
        size="small"
      >
        Refresh
      </Button>

      <Button variant="outlined" onClick={clearFilters} size="small">
        Clear Filters
      </Button>
    </Box>
  );
};
