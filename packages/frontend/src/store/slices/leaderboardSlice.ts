import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiClient } from '../../services/api/client';

interface LeaderboardEntry {
    id: string;
    rank: number;
    player: {
        id: string;
        nickname: string;
        skill_level: number;
    };
    points: number;
    matches_played: number;
    matches_won: number;
    highest_break: number;
    win_rate: number;
    average_score: number;
    shot_accuracy: number;
}

interface LeaderboardState {
    entries: LeaderboardEntry[];
    timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
    venueId: string | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: number | null;
}

const initialState: LeaderboardState = {
    entries: [],
    timeframe: 'weekly',
    venueId: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
};

export const fetchLeaderboard = createAsyncThunk(
    'leaderboard/fetchLeaderboard',
    async ({ timeframe, venueId }: { timeframe: string; venueId?: string }) => {
        const api = ApiClient.getInstance();
        const url = venueId
            ? `/leaderboard/current-rankings/?timeframe=${timeframe}&venue_id=${venueId}`
            : `/leaderboard/current-rankings/?timeframe=${timeframe}`;
        const response = await api.get(url);
        return response;
    }
);

export const createLeaderboardPeriod = createAsyncThunk(
    'leaderboard/createPeriod',
    async (data: { timeframe: string; startDate: string; endDate: string }) => {
        const api = ApiClient.getInstance();
        const response = await api.post('/leaderboard/create-period/', data);
        return response;
    }
);

const leaderboardSlice = createSlice({
    name: 'leaderboard',
    initialState,
    reducers: {
        setTimeframe: (state, action: PayloadAction<LeaderboardState['timeframe']>) => {
            state.timeframe = action.payload;
        },
        setVenueId: (state, action: PayloadAction<string | null>) => {
            state.venueId = action.payload;
        },
        updateEntry: (state, action: PayloadAction<LeaderboardEntry>) => {
            const index = state.entries.findIndex(entry => entry.id === action.payload.id);
            if (index !== -1) {
                state.entries[index] = action.payload;
            }
        },
        clearLeaderboard: (state) => {
            state.entries = [];
            state.lastUpdated = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeaderboard.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchLeaderboard.fulfilled, (state, action) => {
                state.isLoading = false;
                state.entries = action.payload;
                state.lastUpdated = Date.now();
            })
            .addCase(fetchLeaderboard.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch leaderboard';
            })
            .addCase(createLeaderboardPeriod.fulfilled, (state) => {
                // Trigger a refresh of the leaderboard after creating a new period
                state.lastUpdated = null;
            });
    },
});

export const {
    setTimeframe,
    setVenueId,
    updateEntry,
    clearLeaderboard,
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer; 