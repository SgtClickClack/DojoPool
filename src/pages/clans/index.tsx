import ClanCard from '@/components/clans/ClanCard';
import { getClans, joinClan } from '@/services/APIService';
import type { Clan, ClanSearchFilters } from '@/types/clan';
import { Add, FilterList, Search } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const ClansPage: React.FC = () => {
  const router = useRouter();
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ClanSearchFilters>({
    sortBy: 'rating',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadClans();
  }, [filters]);

  const loadClans = async () => {
    try {
      setLoading(true);
      const clansData = await getClans(filters);
      setClans(clansData);
      setError(null);
    } catch (err) {
      setError('Failed to load clans');
      console.error('Error loading clans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm.trim() || undefined,
    }));
  };

  const handleFilterChange = (field: keyof ClanSearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleJoinClan = async (clanId: string) => {
    try {
      await joinClan(clanId);
      // Refresh clans to update member counts
      await loadClans();
      // Show success message or redirect
      router.push(`/clans/${clanId}`);
    } catch (err) {
      setError('Failed to join clan');
      console.error('Error joining clan:', err);
    }
  };

  const filteredClans = clans.filter((clan) => {
    if (!searchTerm) return true;
    return (
      clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clan.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clan.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
            Clan Discovery
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/clans/create')}
            size="large"
          >
            Create Clan
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Discover and join clans to build alliances, participate in clan wars,
          and dominate territories together.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Clans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, tag, or description..."
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy || 'rating'}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="memberCount">Members</MenuItem>
                <MenuItem value="createdAt">Created</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={filters.sortOrder || 'desc'}
                label="Order"
                onChange={(e) =>
                  handleFilterChange('sortOrder', e.target.value)
                }
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
              startIcon={<FilterList />}
              onClick={() =>
                setFilters({ sortBy: 'rating', sortOrder: 'desc' })
              }
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Count */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          {filteredClans.length} clan{filteredClans.length !== 1 ? 's' : ''}{' '}
          found
        </Typography>
      </Box>

      {/* Clans Grid */}
      {filteredClans.length > 0 ? (
        <Grid container spacing={3}>
          {filteredClans.map((clan) => (
            <Grid item xs={12} sm={6} md={4} key={clan.id}>
              <ClanCard
                clan={clan}
                onJoin={handleJoinClan}
                showJoinButton={true}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No clans found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm
              ? 'Try adjusting your search terms or filters.'
              : 'Be the first to create a clan!'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/clans/create')}
            >
              Create First Clan
            </Button>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default ClansPage;
