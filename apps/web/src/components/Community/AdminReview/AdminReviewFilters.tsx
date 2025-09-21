import { FilterList as FilterIcon } from '@mui/icons-material';
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

interface AdminReviewFiltersProps {
  filters: {
    status: string;
    category: string;
    search: string;
  };
  onFiltersChange: (filters: { status: string; category: string; search: string }) => void;
  onApplyFilters: () => void;
}

const AdminReviewFilters: React.FC<AdminReviewFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
}) => {
  const handleFilterChange = (field: string, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="REQUIRES_CHANGES">Requires Changes</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="CUE_SKIN">Cue Skin</MenuItem>
              <MenuItem value="BALL_SET">Ball Set</MenuItem>
              <MenuItem value="TABLE_THEME">Table Theme</MenuItem>
              <MenuItem value="TABLE_CLOTH">Table Cloth</MenuItem>
              <MenuItem value="AVATAR_FRAME">Avatar Frame</MenuItem>
              <MenuItem value="PARTICLE_EFFECT">Particle Effect</MenuItem>
              <MenuItem value="SOUND_PACK">Sound Pack</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by title or creator..."
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={onApplyFilters}
            fullWidth
          >
            Apply
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AdminReviewFilters;
