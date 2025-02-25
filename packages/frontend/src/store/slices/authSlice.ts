import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiClient } from '../../services/api/client';

interface User {
    id: string;
    email: string;
    nickname: string;
    skill_level: number;
    games_played: number;
    games_won: number;
    highest_break: number;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    error: null,
};

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; password: string }) => {
        const api = ApiClient.getInstance();
        const response = await api.post('/auth/login/', credentials);
        return response;
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (data: { email: string; password: string; nickname: string }) => {
        const api = ApiClient.getInstance();
        const response = await api.post('/auth/register/', data);
        return response;
    }
);

export const refreshTokens = createAsyncThunk(
    'auth/refreshTokens',
    async (_, { getState }) => {
        const api = ApiClient.getInstance();
        const response = await api.post('/auth/refresh/', {
            refresh: (getState() as any).auth.refreshToken,
        });
        return response;
    }
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async () => {
        const api = ApiClient.getInstance();
        const response = await api.get('/players/me/');
        return response;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            return {
                ...initialState,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
            };
        },
        setTokens: (state, action: PayloadAction<{ access: string; refresh: string }>) => {
            state.accessToken = action.payload.access;
            state.refreshToken = action.payload.refresh;
            state.isAuthenticated = true;
            localStorage.setItem('access_token', action.payload.access);
            localStorage.setItem('refresh_token', action.payload.refresh);
        },
        updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.access_token;
                state.refreshToken = action.payload.refresh_token;
                state.isAuthenticated = true;
                localStorage.setItem('access_token', action.payload.access_token);
                localStorage.setItem('refresh_token', action.payload.refresh_token);
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Login failed';
            })
            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.access_token;
                state.refreshToken = action.payload.refresh_token;
                state.isAuthenticated = true;
                localStorage.setItem('access_token', action.payload.access_token);
                localStorage.setItem('refresh_token', action.payload.refresh_token);
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Registration failed';
            })
            // Refresh tokens
            .addCase(refreshTokens.fulfilled, (state, action) => {
                state.accessToken = action.payload.access;
                localStorage.setItem('access_token', action.payload.access);
            })
            .addCase(refreshTokens.rejected, (state) => {
                return {
                    ...initialState,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                };
            })
            // Fetch user profile
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            });
    },
});

export const { logout, setTokens, updateUserProfile } = authSlice.actions;

export default authSlice.reducer; 