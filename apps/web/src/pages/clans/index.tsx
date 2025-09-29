import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import Head from 'next/head';
import Layout from '@/components/Layout/Layout';
import ProtectedRoute from '@/components/Common/ProtectedRoute';
import { getClans } from '@/services/APIService';

interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  members: number;
  territories: number;
  rating: number;
  isPublic: boolean;
  requirements: {
    minRating?: number;
    minLevel?: number;
    invitationOnly: boolean;
    approvalRequired: boolean;
  };
}

interface ClanFilters {
  search?: string;
  sortBy?: 'name' | 'rating' | 'members';
  sortOrder?: 'asc' | 'desc';
}

const ClansPage: React.FC = () => {
  const [clans, setClans] = useState<Clan[]>([]);
  const [filteredClans, setFilteredClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ClanFilters>({
    search: '',
    sortBy: 'rating',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadClans();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clans, filters]);

  const loadClans = async () => {
    try {
      setLoading(true);
      const clansData = await getClans();
      setClans(clansData);
    } catch (error: any) {
      console.error('Failed to load clans:', error);
      setError('Failed to load clans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clans];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (clan) =>
          clan.name.toLowerCase().includes(searchTerm) ||
          clan.tag.toLowerCase().includes(searchTerm) ||
          clan.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'members':
          aValue = a.members;
          bValue = b.members;
          break;
        case 'rating':
        default:
          aValue = a.rating;
          bValue = b.rating;
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredClans(filtered);
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleSortChange = (field: keyof ClanFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      sortBy: 'rating',
      sortOrder: 'desc',
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading clans...</Typography>
          </Container>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Clan Discovery — DojoPool</title>
        </Head>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Clan Discovery
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Discover and join clans to compete for territory and glory.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Search and Filter Controls */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Clans"
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  inputProps={{ 'data-testid': 'search-clans-input' }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange('sortBy', e.target.value)}
                    label="Sort By"
                    data-testid="sort-by-select"
                  >
                    <MenuItem value="rating">Rating</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="members">Members</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort Order</InputLabel>
                  <Select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      handleSortChange('sortOrder', e.target.value)
                    }
                    label="Sort Order"
                    data-testid="sort-order-select"
                  >
                    <MenuItem value="desc">Descending</MenuItem>
                    <MenuItem value="asc">Ascending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={resetFilters}
                  data-testid="reset-filters-button"
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Results Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              {filteredClans.length}{' '}
              {filteredClans.length === 1 ? 'clan' : 'clans'} found
            </Typography>
          </Box>

          {/* Clan Cards */}
          {filteredClans.length === 0 ? (
            <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No clans found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search terms or filters to find more clans.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredClans.map((clan) => (
                <Grid item xs={12} md={6} lg={4} key={clan.id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        elevation: 4,
                      },
                    }}
                    data-testid="clan-card"
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Typography variant="h6" component="h3">
                          {clan.name}
                        </Typography>
                        <Chip
                          label={clan.tag}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: '3em' }}
                      >
                        {clan.description}
                      </Typography>

                      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                        <Chip
                          label={`${clan.members} member${clan.members !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${clan.territories} territor${clan.territories !== 1 ? 'ies' : 'y'}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${clan.rating} rating`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      </Box>

                      {!clan.isPublic && (
                        <Chip
                          label="Private"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      )}

                      {clan.requirements.invitationOnly && (
                        <Chip
                          label="Invitation Only"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ mb: 1, mr: 1 }}
                        />
                      )}

                      {clan.requirements.approvalRequired && (
                        <Chip
                          label="Approval Required"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}

                      {clan.requirements.minRating && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Min Rating: {clan.requirements.minRating}
                        </Typography>
                      )}

                      {clan.requirements.minLevel && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Min Level: {clan.requirements.minLevel}
                        </Typography>
                      )}
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        href={`/clans/${clan.id}`}
                      >
                        View Clan
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Layout>
    </ProtectedRoute>
  );
};

export default ClansPage;
