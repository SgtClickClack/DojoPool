import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiClient } from '../../services/api/client';

interface TableType {
    type: string;
    count: number;
}

interface Venue {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    latitude: number | null;
    longitude: number | null;
    number_of_tables: number;
    table_types: TableType[];
    hourly_rate: number;
    features: string[];
    opening_hours: Record<string, { open: number; close: number }>;
    contact_info: Record<string, string>;
    is_active: boolean;
    rating: number;
    total_matches: number;
    current_occupancy: number;
    occupancy_rate: number;
}

interface VenueState {
    venues: Venue[];
    selectedVenue: Venue | null;
    nearbyVenues: Venue[];
    filters: {
        city: string | null;
        features: string[];
        minRating: number;
        maxOccupancy: number;
    };
    isLoading: boolean;
    error: string | null;
}

const initialState: VenueState = {
    venues: [],
    selectedVenue: null,
    nearbyVenues: [],
    filters: {
        city: null,
        features: [],
        minRating: 0,
        maxOccupancy: 100,
    },
    isLoading: false,
    error: null,
};

export const fetchVenues = createAsyncThunk(
    'venue/fetchVenues',
    async (filters?: Partial<VenueState['filters']>) => {
        const api = ApiClient.getInstance();
        const queryParams = new URLSearchParams();
        
        if (filters?.city) queryParams.append('city', filters.city);
        if (filters?.features?.length) queryParams.append('features', filters.features.join(','));
        if (filters?.minRating) queryParams.append('min_rating', filters.minRating.toString());
        
        const response = await api.get(`/venues/?${queryParams.toString()}`);
        return response;
    }
);

export const fetchNearbyVenues = createAsyncThunk(
    'venue/fetchNearbyVenues',
    async ({ latitude, longitude, radius }: { latitude: number; longitude: number; radius: number }) => {
        const api = ApiClient.getInstance();
        const response = await api.get(
            `/venues/nearby/?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
        );
        return response;
    }
);

export const fetchVenueDetails = createAsyncThunk(
    'venue/fetchVenueDetails',
    async (venueId: string) => {
        const api = ApiClient.getInstance();
        const response = await api.get(`/venues/${venueId}/`);
        return response;
    }
);

export const updateVenueOccupancy = createAsyncThunk(
    'venue/updateOccupancy',
    async ({ venueId, tablesInUse }: { venueId: string; tablesInUse: number }) => {
        const api = ApiClient.getInstance();
        const response = await api.post(`/venues/${venueId}/update-occupancy/`, {
            tables_in_use: tablesInUse,
        });
        return response;
    }
);

const venueSlice = createSlice({
    name: 'venue',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<VenueState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        selectVenue: (state, action: PayloadAction<string>) => {
            state.selectedVenue = state.venues.find(venue => venue.id === action.payload) || null;
        },
        clearSelectedVenue: (state) => {
            state.selectedVenue = null;
        },
        updateVenueInList: (state, action: PayloadAction<Venue>) => {
            const index = state.venues.findIndex(venue => venue.id === action.payload.id);
            if (index !== -1) {
                state.venues[index] = action.payload;
                if (state.selectedVenue?.id === action.payload.id) {
                    state.selectedVenue = action.payload;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch venues
            .addCase(fetchVenues.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVenues.fulfilled, (state, action) => {
                state.isLoading = false;
                state.venues = action.payload;
            })
            .addCase(fetchVenues.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch venues';
            })
            // Fetch nearby venues
            .addCase(fetchNearbyVenues.fulfilled, (state, action) => {
                state.nearbyVenues = action.payload;
            })
            // Fetch venue details
            .addCase(fetchVenueDetails.fulfilled, (state, action) => {
                state.selectedVenue = action.payload;
                const index = state.venues.findIndex(venue => venue.id === action.payload.id);
                if (index !== -1) {
                    state.venues[index] = action.payload;
                }
            })
            // Update venue occupancy
            .addCase(updateVenueOccupancy.fulfilled, (state, action) => {
                const updatedVenue = action.payload;
                const index = state.venues.findIndex(venue => venue.id === updatedVenue.id);
                if (index !== -1) {
                    state.venues[index] = updatedVenue;
                    if (state.selectedVenue?.id === updatedVenue.id) {
                        state.selectedVenue = updatedVenue;
                    }
                }
            });
    },
});

export const {
    setFilters,
    clearFilters,
    selectVenue,
    clearSelectedVenue,
    updateVenueInList,
} = venueSlice.actions;

export default venueSlice.reducer; 