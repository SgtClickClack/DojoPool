import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import { Add, FilterList, Group } from '@mui/icons-material';
import ClanCard from './ClanCard';

interface ClanMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'leader' | 'officer' | 'member';
  level: number;
}

interface Clan {
  id: string;
  name: string;
  description: string;
  location: string;
  memberCount: number;
  maxMembers: number;
  level: number;
  experience: number;
  experienceToNext: number;
  territoryCount: number;
  warWins: number;
  warLosses: number;
  members: ClanMember[];
  isMember: boolean;
}

interface ClanListProps {
  clans: Clan[];
  onJoinClan?: (clanId: string) => void;
  onViewClan?: (clanId: string) => void;
  onLeaveClan?: (clanId: string) => void;
  onCreateClan?: () => void;
}

const ClanList: React.FC<ClanListProps> = ({
  clans,
  onJoinClan,
  onViewClan,
  onLeaveClan,
  onCreateClan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  const filteredClans = useMemo(() => {
    return clans.filter((clan) => {
      const matchesSearch =
        clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clan.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        locationFilter === 'all' || clan.location === locationFilter;

      const matchesLevel =
        levelFilter === 'all' || clan.level.toString() === levelFilter;

      const matchesMember =
        memberFilter === 'all' ||
        (memberFilter === 'member' && clan.isMember) ||
        (memberFilter === 'available' && !clan.isMember);

      return matchesSearch && matchesLocation && matchesLevel && matchesMember;
    });
  }, [clans, searchTerm, locationFilter, levelFilter, memberFilter]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set(clans.map((c) => c.location));
    return Array.from(locations).sort();
  }, [clans]);

  const uniqueLevels = useMemo(() => {
    const levels = new Set(clans.map((c) => c.level));
    return Array.from(levels).sort((a, b) => a - b);
  }, [clans]);

  const getMemberCount = (filter: string) => {
    return clans.filter((c) => {
      if (filter === 'all') return true;
      if (filter === 'member') return c.isMember;
      if (filter === 'available') return !c.isMember;
      return false;
    }).length;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Group sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Clans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join forces with other players and dominate territories
            </Typography>
          </Box>
        </Box>
        {onCreateClan && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateClan}
            size="large"
          >
            Create Clan
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search clans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <MenuItem value="all">All Locations</MenuItem>
                {uniqueLocations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={levelFilter}
                label="Level"
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                {uniqueLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    Level {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={memberFilter}
                label="Status"
                onChange={(e) => setMemberFilter(e.target.value)}
              >
                <MenuItem value="all">All ({getMemberCount('all')})</MenuItem>
                <MenuItem value="member">
                  Member ({getMemberCount('member')})
                </MenuItem>
                <MenuItem value="available">
                  Available ({getMemberCount('available')})
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setLocationFilter('all');
                setLevelFilter('all');
                setMemberFilter('all');
              }}
            >
              Clear All Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results count */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredClans.length} of {clans.length} clans
        </Typography>
      </Box>

      {/* Clan grid */}
      {filteredClans.length > 0 ? (
        <Grid container spacing={3}>
          {filteredClans.map((clan) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={clan.id}>
              <ClanCard
                {...clan}
                onJoin={onJoinClan}
                onView={onViewClan}
                onLeave={onLeaveClan}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Group sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No clans found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ClanList;
