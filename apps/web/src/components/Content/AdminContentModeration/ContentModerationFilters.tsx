import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import React from 'react';
import {
  ContentFilter,
  ContentStatus,
  ContentType,
  ContentVisibility,
} from '@/types/content';

const contentTypeLabels = {
  [ContentType.MATCH_REPLAY]: '🎮 Match',
  [ContentType.CUSTOM_ITEM]: '🎨 Custom',
  [ContentType.HIGH_SCORE]: '🏆 Score',
  [ContentType.ACHIEVEMENT]: '🎯 Achievement',
  [ContentType.TOURNAMENT_HIGHLIGHT]: '🏟️ Tournament',
  [ContentType.VENUE_REVIEW]: '🏢 Venue',
  [ContentType.GENERAL]: '💬 General',
  [ContentType.EVENT]: '📅 Event',
  [ContentType.NEWS_ARTICLE]: '📰 News',
  [ContentType.SYSTEM_MESSAGE]: '📢 System',
};

const visibilityLabels = {
  [ContentVisibility.PUBLIC]: '🌐 Public',
  [ContentVisibility.FRIENDS_ONLY]: '👥 Friends',
  [ContentVisibility.PRIVATE]: '🔒 Private',
};

interface ContentModerationFiltersProps {
  filters: ContentFilter;
  onFiltersChange: (filters: ContentFilter) => void;
}

const ContentModerationFilters: React.FC<ContentModerationFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (field: keyof ContentFilter, value: string) => {
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
        <TextField
          label="Search"
          size="small"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search content..."
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            {Object.values(ContentStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.contentType || ''}
            onChange={(e) => handleFilterChange('contentType', e.target.value)}
            label="Type"
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.entries(contentTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Visibility</InputLabel>
          <Select
            value={filters.visibility || ''}
            onChange={(e) => handleFilterChange('visibility', e.target.value)}
            label="Visibility"
          >
            <MenuItem value="">All</MenuItem>
            {Object.entries(visibilityLabels).map(([value, label]) => (
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

export default ContentModerationFilters;
