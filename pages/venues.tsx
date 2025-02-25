/** @jsxImportSource react */
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import { 
  FilterList as FilterIcon, 
  LocationOn as LocationIcon,
  Search as SearchIcon,
  ViewList as ListIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { debounce } from 'lodash';
import { VenueList } from '../packages/frontend/src/components/Venue/[VENUE]VenueList';

// Import venue types
import { 
  Venue, 
  VenueStatus, 
  BusinessHours,
  VenueStats,
  TableStatus
} from '../packages/frontend/src/types/venue';

// Mock venues data
const MOCK_VENUES: Venue[] = [
  {
    id: 1,
    name: "Golden Cue Billiards",
    description: "Premium pool hall with professional equipment and refreshments.",
    address: {
      street: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94103",
      country: "USA",
      lat: 37.7749,
      lng: -122.4194
    },
    photos: [
      { id: 1, url: "/images/venues/golden-cue.jpg", isPrimary: true },
      { id: 2, url: "/images/venues/golden-cue-2.jpg", isPrimary: false }
    ],
    rating: { average: 4.7, count: 128 },
    businessHours: [
      { day: 0, open: "12:00", close: "23:00", closed: false }, // Sunday
      { day: 1, open: "16:00", close: "23:00", closed: false }, // Monday
      { day: 2, open: "16:00", close: "23:00", closed: false }, // Tuesday
      { day: 3, open: "16:00", close: "23:00", closed: false }, // Wednesday
      { day: 4, open: "16:00", close: "00:00", closed: false }, // Thursday
      { day: 5, open: "16:00", close: "02:00", closed: false }, // Friday
      { day: 6, open: "12:00", close: "02:00", closed: false }  // Saturday
    ],
    amenities: ["Bar", "Food", "Pro Shop", "Tournaments", "Lessons", "WiFi"],
    stats: {
      totalTables: 12,
      availableTables: 3,
      activeGames: 9,
      waitingPlayers: 4
    },
    status: VenueStatus.ACTIVE,
    distance: 1.2
  },
  {
    id: 2,
    name: "Shark's Billiards",
    description: "Competitive atmosphere with regular tournaments and skilled players.",
    address: {
      street: "456 Market Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA",
      lat: 37.7897,
      lng: -122.3981
    },
    photos: [
      { id: 3, url: "/images/venues/sharks.jpg", isPrimary: true },
      { id: 4, url: "/images/venues/sharks-2.jpg", isPrimary: false }
    ],
    rating: { average: 4.2, count: 95 },
    businessHours: [
      { day: 0, open: "14:00", close: "22:00", closed: false }, // Sunday
      { day: 1, open: "17:00", close: "23:00", closed: false }, // Monday
      { day: 2, open: "17:00", close: "23:00", closed: false }, // Tuesday
      { day: 3, open: "17:00", close: "23:00", closed: false }, // Wednesday
      { day: 4, open: "17:00", close: "00:00", closed: false }, // Thursday
      { day: 5, open: "17:00", close: "01:00", closed: false }, // Friday
      { day: 6, open: "14:00", close: "01:00", closed: false }  // Saturday
    ],
    amenities: ["Bar", "Tournaments", "League Play", "WiFi"],
    stats: {
      totalTables: 8,
      availableTables: 1,
      activeGames: 7,
      waitingPlayers: 10
    },
    status: VenueStatus.ACTIVE,
    distance: 2.5
  },
  {
    id: 3,
    name: "Classic Pool & Pub",
    description: "Casual, family-friendly pool hall with dining options.",
    address: {
      street: "789 Broadway",
      city: "Oakland",
      state: "CA",
      zipCode: "94607",
      country: "USA",
      lat: 37.8044,
      lng: -122.2711
    },
    photos: [
      { id: 5, url: "/images/venues/classic-pool.jpg", isPrimary: true },
      { id: 6, url: "/images/venues/classic-pool-2.jpg", isPrimary: false }
    ],
    rating: { average: 4.5, count: 78 },
    businessHours: [
      { day: 0, open: "12:00", close: "20:00", closed: false }, // Sunday
      { day: 1, open: "15:00", close: "22:00", closed: false }, // Monday
      { day: 2, open: "15:00", close: "22:00", closed: false }, // Tuesday
      { day: 3, open: "15:00", close: "22:00", closed: false }, // Wednesday
      { day: 4, open: "15:00", close: "22:00", closed: false }, // Thursday
      { day: 5, open: "15:00", close: "23:00", closed: false }, // Friday
      { day: 6, open: "12:00", close: "23:00", closed: false }  // Saturday
    ],
    amenities: ["Restaurant", "Family-Friendly", "Pro Shop", "Lessons", "WiFi", "Parking"],
    stats: {
      totalTables: 10,
      availableTables: 4,
      activeGames: 6,
      waitingPlayers: 0
    },
    status: VenueStatus.ACTIVE,
    distance: 5.8
  },
  {
    id: 4,
    name: "Downtown Billiards",
    description: "Upscale billiards club with premium equipment and full bar.",
    address: {
      street: "101 Powell Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "USA",
      lat: 37.7855,
      lng: -122.4071
    },
    photos: [
      { id: 7, url: "/images/venues/downtown.jpg", isPrimary: true },
      { id: 8, url: "/images/venues/downtown-2.jpg", isPrimary: false }
    ],
    rating: { average: 4.8, count: 112 },
    businessHours: [
      { day: 0, open: "16:00", close: "23:00", closed: false }, // Sunday
      { day: 1, open: "16:00", close: "00:00", closed: false }, // Monday
      { day: 2, open: "16:00", close: "00:00", closed: false }, // Tuesday
      { day: 3, open: "16:00", close: "00:00", closed: false }, // Wednesday
      { day: 4, open: "16:00", close: "01:00", closed: false }, // Thursday
      { day: 5, open: "16:00", close: "02:00", closed: false }, // Friday
      { day: 6, open: "14:00", close: "02:00", closed: false }  // Saturday
    ],
    amenities: ["Full Bar", "VIP Rooms", "Pro Equipment", "Tournaments", "Valet Parking", "WiFi"],
    stats: {
      totalTables: 15,
      availableTables: 2,
      activeGames: 13,
      waitingPlayers: 8
    },
    status: VenueStatus.ACTIVE,
    distance: 1.7
  }
];

const VenuesPage: React.FC = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>(MOCK_VENUES);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>(MOCK_VENUES);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [distance, setDistance] = useState<number[]>([0, 20]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [tableAvailability, setTableAvailability] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<string>('distance');
  
  // Get all unique amenities from venues
  const allAmenities = Array.from(
    new Set(venues.flatMap(venue => venue.amenities))
  ).sort();

  // Handle search input with debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query) {
        applyFilters('', distance, selectedAmenities, tableAvailability, sortBy);
        return;
      }
      
      applyFilters(query, distance, selectedAmenities, tableAvailability, sortBy);
    }, 300),
    [distance, selectedAmenities, tableAvailability, sortBy]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  // Handle filters
  const applyFilters = (
    query: string,
    distanceRange: number[],
    amenities: string[],
    availability: boolean | null,
    sort: string
  ) => {
    let filtered = [...venues];
    
    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(lowercaseQuery) ||
        venue.description.toLowerCase().includes(lowercaseQuery) ||
        venue.address.city.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    // Filter by distance
    filtered = filtered.filter(venue => 
      venue.distance >= distanceRange[0] && venue.distance <= distanceRange[1]
    );
    
    // Filter by amenities
    if (amenities.length > 0) {
      filtered = filtered.filter(venue => 
        amenities.every(amenity => venue.amenities.includes(amenity))
      );
    }
    
    // Filter by table availability
    if (availability !== null) {
      filtered = filtered.filter(venue => 
        availability ? venue.stats.availableTables > 0 : true
      );
    }
    
    // Sort venues
    filtered.sort((a, b) => {
      switch (sort) {
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating.average - a.rating.average;
        case 'availability':
          return b.stats.availableTables - a.stats.availableTables;
        default:
          return a.distance - b.distance;
      }
    });
    
    setFilteredVenues(filtered);
  };

  const handleDistanceChange = (event: Event, newValue: number | number[]) => {
    const newDistance = newValue as number[];
    setDistance(newDistance);
    applyFilters(searchQuery, newDistance, selectedAmenities, tableAvailability, sortBy);
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentIndex = selectedAmenities.indexOf(amenity);
    const newSelectedAmenities = [...selectedAmenities];
    
    if (currentIndex === -1) {
      newSelectedAmenities.push(amenity);
    } else {
      newSelectedAmenities.splice(currentIndex, 1);
    }
    
    setSelectedAmenities(newSelectedAmenities);
    applyFilters(searchQuery, distance, newSelectedAmenities, tableAvailability, sortBy);
  };

  const handleTableAvailabilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value === 'true' ? true : 
                     event.target.value === 'false' ? false : null;
    setTableAvailability(newValue);
    applyFilters(searchQuery, distance, selectedAmenities, newValue, sortBy);
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newSort = event.target.value as string;
    setSortBy(newSort);
    applyFilters(searchQuery, distance, selectedAmenities, tableAvailability, newSort);
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'map') => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setVenues(MOCK_VENUES);
      applyFilters(searchQuery, distance, selectedAmenities, tableAvailability, sortBy);
      setLoading(false);
    }, 1000);
  };

  // Initial data loading
  useEffect(() => {
    setLoading(true);
    
    // Simulate fetching data from API
    setTimeout(() => {
      setVenues(MOCK_VENUES);
      setFilteredVenues(MOCK_VENUES);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <>
      <Head>
        <title>Venue Discovery | DojoPool</title>
        <meta name="description" content="Find pool venues near you with DojoPool" />
      </Head>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Discover Venues
          </Typography>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
          >
            <ToggleButton value="list" aria-label="list view">
              <ListIcon />
            </ToggleButton>
            <ToggleButton value="map" aria-label="map view">
              <MapIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8} md={9}>
              <TextField
                fullWidth
                placeholder="Search by name, location, or keyword..."
                variant="outlined"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Grid>
            
            {showFilters && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Filters
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography gutterBottom>Distance</Typography>
                  <Slider
                    value={distance}
                    onChange={handleDistanceChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={20}
                    step={1}
                    marks={[
                      { value: 0, label: '0 mi' },
                      { value: 20, label: '20 mi' },
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="sort-select-label">Sort By</InputLabel>
                    <Select
                      labelId="sort-select-label"
                      value={sortBy}
                      label="Sort By"
                      onChange={handleSortChange}
                    >
                      <MenuItem value="distance">Distance</MenuItem>
                      <MenuItem value="rating">Rating</MenuItem>
                      <MenuItem value="availability">Table Availability</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="availability-label">Table Availability</InputLabel>
                    <Select
                      labelId="availability-label"
                      value={tableAvailability === null ? '' : tableAvailability.toString()}
                      label="Table Availability"
                      onChange={handleTableAvailabilityChange}
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="true">Available Now</MenuItem>
                      <MenuItem value="false">All</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography gutterBottom>Amenities</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {allAmenities.map((amenity) => (
                      <Chip
                        key={amenity}
                        label={amenity}
                        onClick={() => handleAmenityToggle(amenity)}
                        color={selectedAmenities.includes(amenity) ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
        
        {viewMode === 'list' && (
          <VenueList 
            venues={filteredVenues} 
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
          />
        )}
        
        {viewMode === 'map' && (
          <Box sx={{ height: '600px', bgcolor: 'background.paper', borderRadius: 1, p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Map View
            </Typography>
            <Alert severity="info">
              Map view is currently under development. Please switch to list view to see venues.
            </Alert>
          </Box>
        )}
      </Container>
    </>
  );
};

export default VenuesPage;