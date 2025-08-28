import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MonetizationOn as MonetizationIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { getTournaments } from '../../src/frontend/api/tournamentApi';
import {
  SponsorshipData,
  cancelSponsorship,
  getTournamentSponsorships,
  sponsorTournament,
  updateSponsorship,
} from '../../src/frontend/api/venues';
import { Tournament } from '../../src/frontend/types/tournament';

interface SponsorshipFormData {
  tournamentId: string;
  benefits: string[];
  duration: number;
  budget: number;
  targetAudience: string;
  promotionChannels: string[];
}

const TournamentSponsorshipPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSponsorship, setEditingSponsorship] =
    useState<SponsorshipData | null>(null);
  const [formData, setFormData] = useState<SponsorshipFormData>({
    tournamentId: '',
    benefits: [],
    duration: 30,
    budget: 0,
    targetAudience: '',
    promotionChannels: [],
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Mock venue ID - in real app this would come from auth context
  const venueId = 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tournamentsData, sponsorshipsData] = await Promise.all([
        getTournaments(),
        getTournamentSponsorships(venueId),
      ]);
      setTournaments(tournamentsData);
      setSponsorships(sponsorshipsData);
    } catch (error) {
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (sponsorship?: SponsorshipData) => {
    if (sponsorship) {
      setEditingSponsorship(sponsorship);
      setFormData({
        tournamentId: sponsorship.tournamentId,
        benefits: sponsorship.benefits,
        duration: sponsorship.duration,
        budget: sponsorship.budget,
        targetAudience: sponsorship.targetAudience || '',
        promotionChannels: sponsorship.promotionChannels || [],
      });
    } else {
      setEditingSponsorship(null);
      setFormData({
        tournamentId: '',
        benefits: [],
        duration: 30,
        budget: 0,
        targetAudience: '',
        promotionChannels: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSponsorship(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingSponsorship) {
        await updateSponsorship(
          venueId,
          editingSponsorship.tournamentId,
          formData
        );
        showSnackbar('Sponsorship updated successfully', 'success');
      } else {
        await sponsorTournament(venueId, formData);
        showSnackbar('Tournament sponsored successfully', 'success');
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      showSnackbar('Failed to save sponsorship', 'error');
    }
  };

  const handleCancelSponsorship = async (sponsorshipId: string) => {
    try {
      await cancelSponsorship(venueId, sponsorshipId);
      showSnackbar('Sponsorship cancelled successfully', 'success');
      loadData();
    } catch (error) {
      showSnackbar('Failed to cancel sponsorship', 'error');
    }
  };

  const getSponsoredTournaments = () => {
    return tournaments.filter((tournament) =>
      sponsorships.some((s) => s.tournamentId === tournament.id)
    );
  };

  const getAvailableTournaments = () => {
    return tournaments.filter(
      (tournament) =>
        !sponsorships.some((s) => s.tournamentId === tournament.id)
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Tournament Sponsorship Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sponsor tournaments to increase visibility and attract more
              players to your venue
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#00a8ff', color: 'white' }}
          >
            Sponsor New Tournament
          </Button>
        </Box>

        {/* Sponsored Tournaments */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <StarIcon sx={{ color: '#ffd700' }} />
            Currently Sponsored Tournaments
          </Typography>

          {getSponsoredTournaments().length === 0 ? (
            <Alert severity="info">
              No sponsored tournaments yet. Start sponsoring tournaments to
              increase your venue's visibility!
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {getSponsoredTournaments().map((tournament) => {
                const sponsorship = sponsorships.find(
                  (s) => s.tournamentId === tournament.id
                );
                return (
                  <Grid item xs={12} md={6} lg={4} key={tournament.id}>
                    <Card sx={{ border: '2px solid #ffd700' }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Typography variant="h6" component="h3">
                            {tournament.name}
                          </Typography>
                          <Chip
                            label="SPONSORED"
                            sx={{
                              bgcolor: '#ffd700',
                              color: 'black',
                              fontWeight: 'bold',
                            }}
                          />
                        </Box>

                        <Stack spacing={1} sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <MonetizationIcon sx={{ color: '#00a8ff' }} />
                            <Typography variant="body2">
                              Budget: ${sponsorship?.budget || 0}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Duration: {sponsorship?.duration || 0} days
                          </Typography>
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Sponsorship">
                            <IconButton
                              size="small"
                              onClick={() =>
                                sponsorship && handleOpenDialog(sponsorship)
                              }
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Sponsorship">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleCancelSponsorship(tournament.id)
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>

        {/* Available Tournaments */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Available Tournaments to Sponsor
          </Typography>

          {getAvailableTournaments().length === 0 ? (
            <Alert severity="info">
              No available tournaments to sponsor at the moment.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {getAvailableTournaments().map((tournament) => (
                <Grid item xs={12} md={6} lg={4} key={tournament.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {tournament.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        Entry Fee: ${tournament.entryFee || 0} • Status:{' '}
                        {tournament.status}
                      </Typography>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            tournamentId: tournament.id,
                          }));
                          handleOpenDialog();
                        }}
                      >
                        Sponsor Tournament
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        {/* Sponsorship Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingSponsorship ? 'Edit Sponsorship' : 'Sponsor Tournament'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tournament</InputLabel>
                    <Select
                      value={formData.tournamentId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tournamentId: e.target.value,
                        }))
                      }
                      disabled={!!editingSponsorship}
                    >
                      {(editingSponsorship
                        ? getSponsoredTournaments()
                        : getAvailableTournaments()
                      ).map((tournament) => (
                        <MenuItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Budget ($)"
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        budget: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duration (days)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Target Audience"
                    value={formData.targetAudience}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetAudience: e.target.value,
                      }))
                    }
                    placeholder="e.g., Local players, Tournament regulars"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Benefits (press Enter to add):
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., Prominent branding, Social media promotion"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (
                          e.target as HTMLInputElement
                        ).value.trim();
                        if (value && !formData.benefits.includes(value)) {
                          setFormData((prev) => ({
                            ...prev,
                            benefits: [...prev.benefits, value],
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Box sx={{ mt: 1 }}>
                    {formData.benefits.map((benefit, index) => (
                      <Chip
                        key={index}
                        label={benefit}
                        onDelete={() => {
                          setFormData((prev) => ({
                            ...prev,
                            benefits: prev.benefits.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.tournamentId || formData.budget <= 0}
            >
              {editingSponsorship ? 'Update Sponsorship' : 'Create Sponsorship'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default TournamentSponsorshipPage;
