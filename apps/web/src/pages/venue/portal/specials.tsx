import ProtectedRoute from '@/components/Common/ProtectedRoute';
import VenuePortalLayout from '@/components/VenuePortal/VenuePortalLayout';
import {
  createVenueSpecial,
  deleteVenueSpecial,
  getMyVenueSpecials,
} from '@/services/APIService';
import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface SpecialItem {
  id: string;
  title: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

const SpecialsPage: React.FC = () => {
  const [specials, setSpecials] = useState<SpecialItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canCreate = title.trim().length > 0;

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const items = await getMyVenueSpecials();
        setSpecials(Array.isArray(items) ? items : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load specials');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const created = await createVenueSpecial({
        title,
        description: description || undefined,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        isActive: true,
      });
      setSpecials((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setStartsAt('');
      setEndsAt('');
      setSuccess('Special created.');
    } catch (e: any) {
      setError(e?.message || 'Failed to create special');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVenueSpecial(id);
      setSpecials((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ProtectedRoute>
      <VenuePortalLayout>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Create Special
                </Typography>
                <Box display="grid" gap={2}>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Starts At (optional)"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Ends At (optional)"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    disabled={!canCreate || saving}
                    onClick={handleCreate}
                  >
                    {saving ? 'Creating...' : 'Create Special'}
                  </Button>
                  {error && <Alert severity="error">{error}</Alert>}
                  {success && <Alert severity="success">{success}</Alert>}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Specials
                </Typography>
                <Box display="grid" gap={2}>
                  {loading && (
                    <Typography color="text.secondary">Loading...</Typography>
                  )}
                  {specials.length === 0 && (
                    <Typography color="text.secondary">
                      No specials yet.
                    </Typography>
                  )}
                  {specials.map((s) => (
                    <Box
                      key={s.id}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1 }}
                    >
                      <Box>
                        <Typography fontWeight={600}>{s.title}</Typography>
                        {s.description && (
                          <Typography color="text.secondary">
                            {s.description}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDelete(s.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </VenuePortalLayout>
    </ProtectedRoute>
  );
};

export default SpecialsPage;
