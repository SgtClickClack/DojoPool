import React, { useState } from 'react';
import { Container, TextField, Button, Stack, Typography, Alert, Box } from '@mui/material';
import { venueRegistrationService } from '../../services/venue/VenueRegistrationService';

const VenueRegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [tables, setTables] = useState<number | ''>('');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name || !address || !city || !state) {
      setError('Please fill in name, address, city, and state.');
      return;
    }
    const cap = typeof capacity === 'string' ? parseInt(capacity, 10) : capacity;
    const tab = typeof tables === 'string' ? parseInt(tables, 10) : tables;
    if (!cap || cap < 1) return setError('Capacity must be a positive number.');
    if (!tab || tab < 1) return setError('Tables must be a positive number.');

    const amenities = amenitiesInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const res = await venueRegistrationService.registerVenue({
        name,
        address,
        city,
        state,
        capacity: cap,
        tables: tab,
        amenities,
      });
      setSuccessMsg(`Venue registered successfully (ID: ${res.id}).`);
      setName('');
      setAddress('');
      setCity('');
      setState('');
      setCapacity('');
      setTables('');
      setAmenitiesInput('');
    } catch (err: any) {
      setError(err?.message || 'Failed to register venue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Register Venue
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Provide basic details to register your venue.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          <TextField label="Venue Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
          <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth required />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} required fullWidth />
            <TextField label="State/Region" value={state} onChange={(e) => setState(e.target.value)} required fullWidth />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="number"
              label="Capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 1 }}
              required
              fullWidth
            />
            <TextField
              type="number"
              label="Tables"
              value={tables}
              onChange={(e) => setTables(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 1 }}
              required
              fullWidth
            />
          </Stack>
          <TextField
            label="Amenities (comma separated)"
            value={amenitiesInput}
            onChange={(e) => setAmenitiesInput(e.target.value)}
            placeholder="WiFi, Cafe, Pro Shop"
            fullWidth
          />

          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register Venue'}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default VenueRegisterPage;
