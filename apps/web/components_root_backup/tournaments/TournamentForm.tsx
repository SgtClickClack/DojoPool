import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createTournament,
  getTournament,
  updateTournament,
} from '../../api/tournaments';
import {
  type CreateTournamentData,
  type Tournament,
} from '../../types/[TOURN]tournament';

interface ParamsType {
  id?: string;
  [key: string]: string | undefined;
}

const TournamentForm: React.FC = () => {
  const { id } = useParams<ParamsType>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue_id: 0,
    format: 'single_elimination' as const,
    start_date: null as moment.Moment | null,
    end_date: null as moment.Moment | null,
    registration_deadline: null as moment.Moment | null,
    max_participants: 2,
    entry_fee: 0,
    prize_pool: 0,
    rules: '',
  });
  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState<Tournament>();

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const data = await getTournament(id!);
      setTournament(data);
      setFormData({
        ...data,
        start_date: moment(data.start_date),
        end_date: moment(data.end_date),
        registration_deadline: data.registration_deadline
          ? moment(data.registration_deadline)
          : undefined,
      });
    } catch (error) {
      console.error('Error fetching tournament:', error);
      console.error('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      const tournamentData: CreateTournamentData = {
        ...formData,
        start_date: formData.start_date?.toISOString() || '',
        end_date: formData.end_date?.toISOString() || '',
        registration_deadline: formData.registration_deadline
          ? formData.registration_deadline.toISOString()
          : undefined,
      };

      if (id) {
        await updateTournament(id, tournamentData);
        console.log('Tournament updated successfully');
      } else {
        await createTournament(tournamentData);
        console.log('Tournament created successfully');
      }
      navigate('/tournaments');
    } catch (error) {
      console.error('Error saving tournament:', error);
      console.error('Failed to save tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tournament-form">
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h1" gutterBottom>
              {id ? 'Edit Tournament' : 'Create Tournament'}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tournament Name"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    inputProps={{ maxLength: 100 }}
                    helperText="Maximum 100 characters"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    inputProps={{ maxLength: 500 }}
                    helperText="Maximum 500 characters"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Venue</InputLabel>
                    <MuiSelect label="Venue">
                      <MenuItem value={1}>Venue 1</MenuItem>
                      <MenuItem value={2}>Venue 2</MenuItem>
                    </MuiSelect>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Tournament Format</InputLabel>
                    <MuiSelect label="Tournament Format">
                      <MenuItem value="single_elimination">
                        Single Elimination
                      </MenuItem>
                      <MenuItem value="double_elimination">
                        Double Elimination
                      </MenuItem>
                      <MenuItem value="round_robin">Round Robin</MenuItem>
                      <MenuItem value="swiss">Swiss System</MenuItem>
                    </MuiSelect>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Start Date"
                    slotProps={{
                      textField: { fullWidth: true, required: true },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="End Date"
                    slotProps={{
                      textField: { fullWidth: true, required: true },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Registration Deadline"
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Max Participants"
                    type="number"
                    inputProps={{ min: 2 }}
                    helperText="Must have at least 2 participants"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Entry Fee"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{ startAdornment: '$' }}
                    helperText="Entry fee cannot be negative"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Prize Pool"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{ startAdornment: '$' }}
                    helperText="Prize pool cannot be negative"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tournament Rules"
                    multiline
                    rows={6}
                    inputProps={{ maxLength: 1000 }}
                    helperText="Maximum 1000 characters"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/tournaments')}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading}
                    >
                      {id ? 'Update Tournament' : 'Create Tournament'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </LocalizationProvider>
    </div>
  );
};

export default TournamentForm;
