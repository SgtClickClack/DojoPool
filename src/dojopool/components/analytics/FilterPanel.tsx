import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  useTheme,
} from '@mui/material';

interface FilterPanelProps {
  selectedMetrics: string[];
  selectedDimension: string;
  selectedPeriod: string;
  onMetricsChange: (metrics: string[]) => void;
  onDimensionChange: (dimension: string) => void;
  onPeriodChange: (period: string) => void;
  isAdmin: boolean;
}

const METRICS = [
  { value: 'games_played', label: 'Games Played' },
  { value: 'win_rate', label: 'Win Rate' },
  { value: 'avg_score', label: 'Average Score' },
  { value: 'occupancy_rate', label: 'Occupancy Rate' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'response_time', label: 'Response Time' },
  { value: 'error_rate', label: 'Error Rate' },
  { value: 'cpu_usage', label: 'CPU Usage' },
];

const DIMENSIONS = [
  { value: 'user', label: 'User' },
  { value: 'venue', label: 'Venue' },
  { value: 'game', label: 'Game' },
];

const PERIODS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedMetrics,
  selectedDimension,
  selectedPeriod,
  onMetricsChange,
  onDimensionChange,
  onPeriodChange,
  isAdmin,
}) => {
  const theme = useTheme();

  const handleMetricsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onMetricsChange(typeof value === 'string' ? value.split(',') : value);
  };

  const handleDimensionChange = (event: SelectChangeEvent) => {
    onDimensionChange(event.target.value);
  };

  const handlePeriodChange = (event: SelectChangeEvent) => {
    onPeriodChange(event.target.value);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: 200, flex: 1 }}>
        <InputLabel id="metrics-label">Metrics</InputLabel>
        <Select
          labelId="metrics-label"
          id="metrics"
          multiple
          value={selectedMetrics}
          onChange={handleMetricsChange}
          input={<OutlinedInput id="select-metrics" label="Metrics" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip
                  key={value}
                  label={METRICS.find((m) => m.value === value)?.label || value}
                  size="small"
                />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {METRICS.map((metric) => (
            <MenuItem
              key={metric.value}
              value={metric.value}
              sx={{
                fontWeight: selectedMetrics.includes(metric.value)
                  ? theme.typography.fontWeightMedium
                  : theme.typography.fontWeightRegular,
              }}
            >
              {metric.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isAdmin && (
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="dimension-label">Dimension</InputLabel>
          <Select
            labelId="dimension-label"
            id="dimension"
            value={selectedDimension}
            label="Dimension"
            onChange={handleDimensionChange}
          >
            {DIMENSIONS.map((dimension) => (
              <MenuItem key={dimension.value} value={dimension.value}>
                {dimension.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel id="period-label">Period</InputLabel>
        <Select
          labelId="period-label"
          id="period"
          value={selectedPeriod}
          label="Period"
          onChange={handlePeriodChange}
        >
          {PERIODS.map((period) => (
            <MenuItem key={period.value} value={period.value}>
              {period.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
