import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { appApi } from '@/services/api';
import { Venue, Game, CreateGameData } from '@/types/api';

interface AppState {
  venues: Venue[];
  games: Game[];
  currentGame: Game | null;
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

export const fetchVenues = createAsyncThunk<
  Venue[],
  void,
  { rejectValue: string }
>('app/fetchVenues', async (_, { rejectWithValue }) => {
  try {
    const response = await appApi.getVenues();
    return response;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const fetchGames = createAsyncThunk<
  Game[],
  void,
  { rejectValue: string }
>('app/fetchGames', async (_, { rejectWithValue }) => {
  try {
    const response = await appApi.getGames();
    return response;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const joinGame = createAsyncThunk<
  Game,
  string,
  { rejectValue: string }
>('app/joinGame', async (gameId, { rejectWithValue }) => {
  try {
    const response = await appApi.joinGame(gameId);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

export const createGame = createAsyncThunk<
  Game,
  CreateGameData,
  { rejectValue: string }
>('app/createGame', async (gameData, { rejectWithValue }) => {
  try {
    const response = await appApi.createGame(gameData);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('An unknown error occurred');
  }
});

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentGame: (state: AppState, action: PayloadAction<Game | null>) => {
      state.currentGame = action.payload;
    },
    resetError: (state: AppState) => {
      state.error = null;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<AppState>) => {
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
        state.error = action.payload ?? 'An unknown error occurred';
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
        state.error = action.payload ?? 'An unknown error occurred';
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
        state.error = action.payload ?? 'An unknown error occurred';
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
        state.error = action.payload ?? 'An unknown error occurred';
      });
  },
});

export const { setCurrentGame, resetError } = appSlice.actions;
export default appSlice.reducer; 