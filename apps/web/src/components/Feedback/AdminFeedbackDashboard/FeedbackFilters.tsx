import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
  Box,
} from '@mui/material';
import React from 'react';
import {
  FeedbackFilter,
  FeedbackStatus,
  FeedbackCategory,
} from '@/types/feedback';

const categoryLabels = {
  [FeedbackCategory.BUG]: '🐛 Bug',
  [FeedbackCategory.FEATURE_REQUEST]: '💡 Feature',
  [FeedbackCategory.GENERAL_FEEDBACK]: '💬 Feedback',
  [FeedbackCategory.VENUE_ISSUE]: '🏢 Venue',
  [FeedbackCategory.TECHNICAL_SUPPORT]: '🛠️ Support',
  [FeedbackCategory.UI_UX_IMPROVEMENT]: '🎨 UI/UX',
  [FeedbackCategory.PERFORMANCE_ISSUE]: '⚡ Performance',
};

interface FeedbackFiltersProps {
  filters: FeedbackFilter;
  onFiltersChange: (filters: FeedbackFilter) => void;
}

const FeedbackFilters: React.FC<FeedbackFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (field: keyof FeedbackFilter, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            {Object.values(FeedbackStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            label="Category"
          >
            <MenuItem value="">All</MenuItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          onClick={clearFilters}
          size="small"
        >
          Clear Filters
        </Button>
      </Box>
    </Paper>
  );
};

export default FeedbackFilters;
