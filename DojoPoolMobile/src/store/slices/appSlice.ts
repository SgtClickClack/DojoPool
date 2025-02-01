import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { appApi } from '@/services/api';

interface AppState {
  venues: any[];
  games: any[];
  currentGame: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  venues: [],
  games: [],
  currentGame: null,
  loading: false,
  error: null,
};

export const fetchVenues = createAsyncThunk('app/fetchVenues', async (_, { rejectWithValue }) => {
  try {
    const response = await appApi.getVenues();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchGames = createAsyncThunk('app/fetchGames', async (_, { rejectWithValue }) => {
  try {
    const response = await appApi.getGames();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const joinGame = createAsyncThunk(
  'app/joinGame',
  async (gameId: string, { rejectWithValue }) => {
    try {
      const response = await appApi.joinGame(gameId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createGame = createAsyncThunk(
  'app/createGame',
  async (gameData: any, { rejectWithValue }) => {
    try {
      const response = await appApi.createGame(gameData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentGame: (state, action) => {
      state.currentGame = action.payload;
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Venues
    builder
      .addCase(fetchVenues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.venues = action.payload;
        state.loading = false;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Games
    builder
      .addCase(fetchGames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.games = action.payload;
        state.loading = false;
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Join Game
    builder
      .addCase(joinGame.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.currentGame = action.payload;
        state.loading = false;
      })
      .addCase(joinGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Game
    builder
      .addCase(createGame.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.games = [...state.games, action.payload];
        state.currentGame = action.payload;
        state.loading = false;
      })
      .addCase(createGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentGame, resetError } = appSlice.actions;
export default appSlice.reducer; 