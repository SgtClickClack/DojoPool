import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Search, FilterList, Sort } from '@mui/icons-material';
import ClanCard from './ClanCard';
import type { Clan } from '@/types/clan';

interface ClanListProps {
  clans: Clan[];
  onJoin: (clanId: string) => void;
  onView: (clanId: string) => void;
  onLeave?: (clanId: string) => void;
  onFilter?: (filter: string) => void;
  onSort?: (sort: string) => void;
  loading?: boolean;
  error?: string;
  userClanId?: string | null;
  disabled?: boolean;
}

const ClanList: React.FC<ClanListProps> = ({
  clans,
  onJoin,
  onView,
  onLeave,
  onFilter,
  onSort,
  loading = false,
  error,
  userClanId,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onFilter?.(e.target.value);
  }, [onFilter]);

  const handleStatusChange = useCallback((event: any) => {
    setStatusFilter(event.target.value);
  }, []);

  const handleSortChange = useCallback((event: any) => {
    setSortBy(event.target.value);
    onSort?.(event.target.value);
  }, [onSort]);

  const filteredClans = useMemo(() => {
    let filtered = clans.filter(clan =>
      clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clan.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(clan => clan.isActive === (statusFilter === 'active'));
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return b.level - a.level;
        case 'members':
          return (b.members?.length || 0) - (a.members?.length || 0);
        case 'reputation':
          return b.reputation - a.reputation;
        default:
          return 0;
      }
    });
  }, [clans, searchTerm, statusFilter, sortBy]);

  const isUserMemberOfClan = useCallback((clanId: string) => {
    return userClanId === clanId;
  }, [userClanId]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Clans</Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Clans ({clans.length})</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search clans..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="all">All Clans</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortBy}
              label="Sort"
              onChange={handleSortChange}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="level">Level</MenuItem>
              <MenuItem value="members">Members</MenuItem>
              <MenuItem value="reputation">Reputation</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {filteredClans.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No clans found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredClans.map((clan) => (
            <Grid item xs={12} sm={6} md={4} key={clan.id}>
              <ClanCard
                id={clan.id}
                name={clan.name}
                description={clan.description}
                location={clan.location}
                memberCount={clan.members.length}
                treasury={clan.dojoCoinBalance || 0}
                leader={clan.leader || { id: '', email: '', username: '' }}
                clan={clan}
                onJoin={(clanId) => onJoin(clanId)}
                onView={(clanId) => onView(clanId)}
                disabled={disabled}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ClanList;
