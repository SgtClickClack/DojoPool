import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import {
  validateVenueName,
  validateAddress,
  validatePhoneNumber,
  validateEmail,
  validateCoordinates,
} from '../../lib/validation';

interface FormData {
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  location?: string;
}

export default function RegisterVenue() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    latitude: '',
    longitude: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!validateVenueName(formData.name)) {
      errors.name = 'Venue name must be between 3 and 100 characters';
      isValid = false;
    }

    if (!validateAddress(formData.address)) {
      errors.address = 'Please enter a valid address';
      isValid = false;
    }

    if (!validateEmail(formData.contact_email)) {
      errors.contact_email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!validatePhoneNumber(formData.contact_phone)) {
      errors.contact_phone = 'Please enter a valid phone number';
      isValid = false;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!validateCoordinates(lat, lng)) {
      errors.location = 'Please select a valid location on the map';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/venue/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register venue');
      }

      router.push(`/venues/${data.venueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register venue');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not logged in or not a venue owner
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'venue_owner') {
      router.push('/venues');
    }
  }, [user, router]);

  if (!user || user.role !== 'venue_owner') {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Register Your Venue
        </Typography>
        <Typography color="textSecondary" paragraph>
          Join the DojoPool network and start hosting games at your venue.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Venue Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={!!formErrors.address}
                helperText={formErrors.address}
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contact Email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                error={!!formErrors.contact_email}
                helperText={formErrors.contact_email}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contact Phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                error={!!formErrors.contact_phone}
                helperText={formErrors.contact_phone}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Latitude"
                name="latitude"
                type="number"
                value={formData.latitude}
                onChange={handleChange}
                error={!!formErrors.location}
                helperText={formErrors.location}
                disabled={loading}
                inputProps={{
                  step: 'any',
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Longitude"
                name="longitude"
                type="number"
                value={formData.longitude}
                onChange={handleChange}
                error={!!formErrors.location}
                disabled={loading}
                inputProps={{
                  step: 'any',
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Registering...' : 'Register Venue'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
} 