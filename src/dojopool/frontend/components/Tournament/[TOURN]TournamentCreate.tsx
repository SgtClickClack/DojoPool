import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TournamentFormat } from '../../types/tournament';

const TournamentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: TournamentFormat.SINGLE_ELIMINATION,
    startDate: new Date(),
    registrationDeadline: new Date(),
    maxPlayers: 16,
    minPlayers: 4,
    venue: '',
    prizePool: {
      enabled: false,
      currency: 'USD',
      amount: 0,
      distribution: [
        { position: 1, percentage: 50 },
        { position: 2, percentage: 30 },
        { position: 3, percentage: 20 },
      ],
    },
    rules: {
      gameFormat: '8-Ball',
      raceToGames: 3,
      timeLimit: 0,
      breakAndRun: true,
      handicap: false,
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target as { name?: string; value: unknown };
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleRulesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleRuleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [name as string]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement tournament creation API call
      navigate('/tournaments');
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Create Tournament
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Tournament Name"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  handleChange(e as React.ChangeEvent<HTMLInputElement>)
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) =>
                  handleChange(e as React.ChangeEvent<HTMLInputElement>)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Format</InputLabel>
                <Select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  label="Format"
                >
                  {Object.values(TournamentFormat).map((format) => (
                    <MenuItem key={format} value={format}>
                      {format.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Venue</InputLabel>
                <Select
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  label="Venue"
                >
                  <MenuItem value="venue1">Venue 1</MenuItem>
                  <MenuItem value="venue2">Venue 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date: any) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: date || new Date(),
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Registration Deadline"
                value={formData.registrationDeadline}
                onChange={(date: any) =>
                  setFormData((prev) => ({
                    ...prev,
                    registrationDeadline: date || new Date(),
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Maximum Players"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={(e) =>
                  handleChange(e as React.ChangeEvent<HTMLInputElement>)
                }
                inputProps={{ min: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Minimum Players"
                name="minPlayers"
                value={formData.minPlayers}
                onChange={(e) =>
                  handleChange(e as React.ChangeEvent<HTMLInputElement>)
                }
                inputProps={{ min: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Rules
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Game Format</InputLabel>
                    <Select
                      name="gameFormat"
                      value={formData.rules.gameFormat}
                      onChange={handleRuleSelectChange}
                      label="Game Format"
                    >
                      <MenuItem value="8-Ball">8-Ball</MenuItem>
                      <MenuItem value="9-Ball">9-Ball</MenuItem>
                      <MenuItem value="10-Ball">10-Ball</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Race to Games"
                    name="raceToGames"
                    value={formData.rules.raceToGames}
                    onChange={handleRulesChange}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.rules.breakAndRun}
                        onChange={handleRulesChange}
                        name="breakAndRun"
                      />
                    }
                    label="Break and Run"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.rules.handicap}
                        onChange={handleRulesChange}
                        name="handicap"
                      />
                    }
                    label="Handicap System"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tournaments')}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained">
                  Create Tournament
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default TournamentCreate;
