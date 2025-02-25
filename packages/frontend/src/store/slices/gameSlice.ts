import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiClient } from '../../services/api/client';

interface Player {
    id: string;
    nickname: string;
    skill_level: number;
}

interface Shot {
    timestamp: number;
    player_id: string;
    type: string;
    successful: boolean;
    points: number;
}

interface Break {
    timestamp: number;
    player_id: string;
    points: number;
}

interface Match {
    id: string;
    player1: Player;
    player2: Player;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    scheduled_time: string;
    start_time?: string;
    end_time?: string;
    score: {
        player1: number;
        player2: number;
    };
    duration?: number;
    statistics: {
        player1: {
            shots_taken: number;
            shots_made: number;
            highest_break: number;
            average_shot_time: number;
        };
        player2: {
            shots_taken: number;
            shots_made: number;
            highest_break: number;
            average_shot_time: number;
        };
    };
}

interface GameState {
    currentMatch: {
        id: string | null;
        player1: Player | null;
        player2: Player | null;
        status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
        score: {
            player1: number;
            player2: number;
        };
        winner: string | null;
        venue_id: string | null;
    };
    matches: Match[];
    shots: Shot[];
    breaks: Break[];
    statistics: {
        player1: {
            shots_taken: number;
            shots_made: number;
            highest_break: number;
            average_shot_time: number;
        };
        player2: {
            shots_taken: number;
            shots_made: number;
            highest_break: number;
            average_shot_time: number;
        };
    };
    isLoading: boolean;
    error: string | null;
}

const initialState: GameState = {
    currentMatch: {
        id: null,
        player1: null,
        player2: null,
        status: 'scheduled',
        score: {
            player1: 0,
            player2: 0,
        },
        winner: null,
        venue_id: null,
    },
    matches: [],
    shots: [],
    breaks: [],
    statistics: {
        player1: {
            shots_taken: 0,
            shots_made: 0,
            highest_break: 0,
            average_shot_time: 0,
        },
        player2: {
            shots_taken: 0,
            shots_made: 0,
            highest_break: 0,
            average_shot_time: 0,
        },
    },
    isLoading: false,
    error: null,
};

// Async thunks
export const fetchMatch = createAsyncThunk(
    'game/fetchMatch',
    async (matchId: string) => {
        const api = ApiClient.getInstance();
        const response = await api.get(`/matches/${matchId}/`);
        return response;
    }
);

export const recordShot = createAsyncThunk(
    'game/recordShot',
    async (data: { matchId: string; shot: Omit<Shot, 'timestamp'> }) => {
        const api = ApiClient.getInstance();
        const response = await api.post(`/matches/${data.matchId}/record-shot/`, data.shot);
        return response;
    }
);

export const recordBreak = createAsyncThunk(
    'game/recordBreak',
    async (data: { matchId: string; break: Omit<Break, 'timestamp'> }) => {
        const api = ApiClient.getInstance();
        const response = await api.post(`/matches/${data.matchId}/record-break/`, data.break);
        return response;
    }
);

export const endMatch = createAsyncThunk(
    'game/endMatch',
    async (data: { matchId: string; winnerId: string; finalScore: { player1: number; player2: number } }) => {
        const api = ApiClient.getInstance();
        const response = await api.post(`/matches/${data.matchId}/end-match/`, {
            winner_id: data.winnerId,
            final_score: data.finalScore,
        });
        return response;
    }
);

export const fetchMatchHistory = createAsyncThunk(
    'game/fetchMatchHistory',
    async (params: {
        playerId?: string;
        venueId?: string;
        page: number;
        rowsPerPage: number;
        sortField: string;
        sortOrder: 'asc' | 'desc';
    }) => {
        const api = ApiClient.getInstance();
        const queryParams = new URLSearchParams();

        if (params.playerId) queryParams.append('player_id', params.playerId);
        if (params.venueId) queryParams.append('venue_id', params.venueId);
        
        queryParams.append('page', params.page.toString());
        queryParams.append('page_size', params.rowsPerPage.toString());
        queryParams.append('sort_field', params.sortField);
        queryParams.append('sort_order', params.sortOrder);

        const response = await api.get(`/matches/?${queryParams.toString()}`);
        return response;
    }
);

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        updateMatchState: (state, action: PayloadAction<Partial<GameState['currentMatch']>>) => {
            state.currentMatch = {
                ...state.currentMatch,
                ...action.payload,
            };
        },
        addShot: (state, action: PayloadAction<Shot>) => {
            state.shots.push(action.payload);
            const playerKey = state.currentMatch.player1?.id === action.payload.player_id ? 'player1' : 'player2';
            state.statistics[playerKey].shots_taken++;
            if (action.payload.successful) {
                state.statistics[playerKey].shots_made++;
            }
        },
        addBreak: (state, action: PayloadAction<Break>) => {
            state.breaks.push(action.payload);
            const playerKey = state.currentMatch.player1?.id === action.payload.player_id ? 'player1' : 'player2';
            state.statistics[playerKey].highest_break = Math.max(
                state.statistics[playerKey].highest_break,
                action.payload.points
            );
        },
        updateScore: (state, action: PayloadAction<{ player1: number; player2: number }>) => {
            state.currentMatch.score = action.payload;
        },
        resetMatch: (state) => {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMatch.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMatch.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentMatch = action.payload;
            })
            .addCase(fetchMatch.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch match';
            })
            .addCase(recordShot.fulfilled, (state, action) => {
                // Handle shot recording success
            })
            .addCase(recordBreak.fulfilled, (state, action) => {
                // Handle break recording success
            })
            .addCase(endMatch.fulfilled, (state, action) => {
                state.currentMatch.status = 'completed';
                state.currentMatch.winner = action.payload.winner_id;
            })
            .addCase(fetchMatchHistory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMatchHistory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.matches = action.payload;
            })
            .addCase(fetchMatchHistory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch match history';
            });
    },
});

export const {
    updateMatchState,
    addShot,
    addBreak,
    updateScore,
    resetMatch,
} = gameSlice.actions;

export default gameSlice.reducer; 