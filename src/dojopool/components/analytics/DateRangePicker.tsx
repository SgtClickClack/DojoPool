import React from 'react';
import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange
}) => {
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      onChange({
        startDate: date,
        endDate: endDate < date ? date : endDate
      });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      onChange({
        startDate: startDate > date ? date : startDate,
        endDate: date
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={handleStartDateChange}
          maxDate={endDate}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              sx={{ width: '100%' }}
            />
          )}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={handleEndDateChange}
          minDate={startDate}
          maxDate={new Date()}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              sx={{ width: '100%' }}
            />
          )}
        />
      </Box>
    </LocalizationProvider>
  );
}; 