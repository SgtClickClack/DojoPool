import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import gameReducer from './slices/gameSlice';
import authReducer from './slices/authSlice';
import venueReducer from './slices/venueSlice';
import leaderboardReducer from './slices/leaderboardSlice';

export const store = configureStore({
    reducer: {
        game: gameReducer,
        auth: authReducer,
        venue: venueReducer,
        leaderboard: leaderboardReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['game/setWebSocket'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.socket'],
                // Ignore these paths in the state
                ignoredPaths: ['game.socket'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 