import ProtectedRoute from '@/components/Common/ProtectedRoute';
import VenuePortalLayout from '@/components/VenuePortal/VenuePortalLayout';
import { getMyVenue, updateMyVenue } from '@/services/APIService';
import { type VenueHours } from '@/types/venue';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const defaultHours: VenueHours[] = [
  { day: 'Monday', open: '09:00', close: '22:00', isOpen: true },
  { day: 'Tuesday', open: '09:00', close: '22:00', isOpen: true },
  { day: 'Wednesday', open: '09:00', close: '22:00', isOpen: true },
  { day: 'Thursday', open: '09:00', close: '22:00', isOpen: true },
  { day: 'Friday', open: '09:00', close: '00:00', isOpen: true },
  { day: 'Saturday', open: '10:00', close: '00:00', isOpen: true },
  { day: 'Sunday', open: '10:00', close: '20:00', isOpen: true },
];

const ProfilePage: React.FC = () => {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [hours, setHours] = useState<VenueHours[]>(defaultHours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const venue = await getMyVenue();
        setDescription(venue?.description ?? '');
        setImages(Array.isArray(venue?.images) ? venue.images : []);
        if (Array.isArray(venue?.hours) && venue.hours.length > 0) {
          setHours(
            venue.hours.map((h: any) => ({
              day: h.day,
              open: h.open,
              close: h.close,
              isOpen: h.isOpen ?? true,
            }))
          );
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load venue');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onAddImage = useCallback(() => {
    const url = prompt('Enter image URL');
    if (url) setImages((prev) => [...prev, url]);
  }, []);

  const onRemoveImage = useCallback((idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleHourChange = useCallback(
    (index: number, key: 'open' | 'close' | 'day', value: string) => {
      setHours((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [key]: value };
        return next;
      });
    },
    []
  );

  const canSave = useMemo(() => description.trim().length >= 10, [description]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await updateMyVenue({ description, images, hours });
      setSuccess('Venue profile updated.');
    } catch (e: any) {
      setError(e?.message || 'Failed to update venue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <VenuePortalLayout>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                {loading ? (
                  <Typography color="text.secondary">Loading...</Typography>
                ) : null}
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your venue, vibe, features, and events."
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Photo Gallery
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {images.map((src, idx) => (
                    <Box key={src + idx} position="relative">
                      <Box
                        component="img"
                        src={src}
                        alt={`venue-${idx}`}
                        sx={{
                          width: 120,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                      <Button size="small" onClick={() => onRemoveImage(idx)}>
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Box>
                <Button sx={{ mt: 2 }} variant="outlined" onClick={onAddImage}>
                  Add Image
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Opening Hours
                </Typography>
                <Grid container spacing={2}>
                  {hours.map((h, i) => (
                    <Grid key={h.day} item xs={12} sm={6} md={4} lg={3}>
                      <Box display="grid" gap={1}>
                        <Typography variant="subtitle2">{h.day}</Typography>
                        <TextField
                          label="Open"
                          value={h.open}
                          onChange={(e) =>
                            handleHourChange(i, 'open', e.target.value)
                          }
                        />
                        <TextField
                          label="Close"
                          value={h.close}
                          onChange={(e) =>
                            handleHourChange(i, 'close', e.target.value)
                          }
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                disabled={!canSave || saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </VenuePortalLayout>
    </ProtectedRoute>
  );
};

export default ProfilePage;
