import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import EditDojoModal from '../components/dojo/EditDojoModal';
import { Dojo, DojoService } from '../services/dojo.service';

const DojosPage: React.FC = () => {
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDojo, setEditingDojo] = useState<Dojo | null>(null);
  const [deletingDojoId, setDeletingDojoId] = useState<string | null>(null);

  const dojoService = new DojoService();

  // Mock data for now - this would come from your API
  const mockDojos: Dojo[] = [
    {
      id: '1',
      name: 'The Jade Tiger',
      location: 'Brisbane, QLD',
      status: 'active',
      owner: 'RyuKlaw',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Crimson Monkey Dojo',
      location: 'Gold Coast, QLD',
      status: 'active',
      owner: 'MonkeyMaster',
      createdAt: '2024-02-20',
    },
    {
      id: '3',
      name: 'Azure Dragon Pool Hall',
      location: 'Sunshine Coast, QLD',
      status: 'maintenance',
      owner: 'DragonKeeper',
      createdAt: '2024-03-10',
    },
    {
      id: '4',
      name: 'Golden Phoenix Dojo',
      location: 'Toowoomba, QLD',
      status: 'inactive',
      owner: 'PhoenixRise',
      createdAt: '2024-01-30',
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDojos(mockDojos);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEditDojo = (dojo: Dojo) => {
    setEditingDojo(dojo);
  };

  const handleDeleteDojo = async (dojoId: string) => {
    const dojoName = dojos.find(d => d.id === dojoId)?.name || 'this dojo';
    const confirmed = window.confirm(
      `Are you sure you want to delete "${dojoName}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDojoId(dojoId);
      await dojoService.deleteDojo(dojoId);
      
      // Remove the deleted dojo from the local state
      setDojos((prevDojos) => prevDojos.filter((dojo) => dojo.id !== dojoId));
      
      // Show success message (you could add a toast notification here)
      console.log('Dojo deleted successfully');
    } catch (error) {
      console.error('Failed to delete dojo:', error);
      // Show error message (you could add a toast notification here)
      alert('Failed to delete dojo. Please try again.');
    } finally {
      setDeletingDojoId(null);
    }
  };

  const handleDojoUpdate = (updatedDojo: Dojo) => {
    setDojos((prevDojos) =>
      prevDojos.map((dojo) => (dojo.id === updatedDojo.id ? updatedDojo : dojo))
    );
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'inactive':
        return <Chip label="Inactive" color="default" size="small" />;
      case 'maintenance':
        return <Chip label="Maintenance" color="warning" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" py={5}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading dojos...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Dojo Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your pool dojos and venues
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddIcon />}>
          Add New Dojo
        </Button>
      </Box>

      <Grid container spacing={3}>
        {dojos.map((dojo) => (
          <Grid key={dojo.id} xs={12} sm={6} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Typography variant="h6" component="h2" gutterBottom>
                    {dojo.name}
                  </Typography>
                  {getStatusChip(dojo.status)}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  📍 {dojo.location}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  👤 Owner: {dojo.owner}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  📅 Created: {new Date(dojo.createdAt).toLocaleDateString()}
                </Typography>

                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditDojo(dojo)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={deletingDojoId === dojo.id ? <CircularProgress size={16} /> : <DeleteIcon />}
                    onClick={() => handleDeleteDojo(dojo.id)}
                    disabled={deletingDojoId === dojo.id}
                  >
                    {deletingDojoId === dojo.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {dojos.length === 0 && !loading && (
        <Grid container justifyContent="center">
          <Grid xs={12} md={6}>
            <Box textAlign="center" py={5}>
              <Typography
                variant="h1"
                color="text.secondary"
                sx={{ fontSize: '4rem' }}
              >
                🏢
              </Typography>
              <Typography
                variant="h4"
                component="h3"
                gutterBottom
                sx={{ mt: 3 }}
              >
                No Dojos Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Get started by adding your first dojo.
              </Typography>
              <Button variant="contained" size="large" startIcon={<AddIcon />}>
                Add Your First Dojo
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}

      <EditDojoModal
        dojo={editingDojo}
        isOpen={!!editingDojo}
        onClose={() => setEditingDojo(null)}
        onUpdate={handleDojoUpdate}
      />
    </Container>
  );
};

export default DojosPage;
