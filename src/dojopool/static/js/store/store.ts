/**
 * State management module.
 * Provides a simple reactive store for managing application state.
 */
import { Config } from "../config";

type Listener<T> = (state: T) => void;
type Selector<T, R> = (state: T) => R;
type Reducer<T> = (state: T) => T;
type AsyncReducer<T> = (state: T) => Promise<T>;

export class Store<T extends object> {
  private state: T;
  private listeners: Set<Listener<T>>;
  private selectors: Map<Selector<T, any>, Set<Listener<any>>>;

  constructor(initialState: T) {
    this.state = initialState;
    this.listeners = new Set();
    this.selectors = new Map();
  }

  /**
   * Get current state.
   */
  getState(): T {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to specific state slice.
   */
  select<R>(selector: Selector<T, R>, listener: Listener<R>): () => void {
    if (!this.selectors.has(selector)) {
      this.selectors.set(selector, new Set());
    }

    this.selectors.get(selector)?.add(listener);
    listener(selector(this.state));

    return () => this.selectors.get(selector)?.delete(listener);
  }

  /**
   * Update state with reducer.
   */
  update(reducer: Reducer<T>): void {
    const newState = reducer(this.state);
    if (newState !== this.state) {
      this.state = newState;
      this.notify();
    }
  }

  /**
   * Update state asynchronously.
   */
  async updateAsync(reducer: AsyncReducer<T>): Promise<void> {
    const newState = await reducer(this.state);
    if (newState !== this.state) {
      this.state = newState;
      this.notify();
    }
  }

  /**
   * Notify all listeners of state change.
   */
  private notify(): void {
    // Notify global listeners
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error("Error in store listener:", error);
      }
    });

    // Notify selector listeners
    this.selectors.forEach((listeners, selector) => {
      const value = selector(this.state);
      listeners.forEach((listener) => {
        try {
          listener(value);
        } catch (error) {
          console.error("Error in selector listener:", error);
        }
      });
    });
  }
}

// Application state interface
interface AppState {
  auth: {
    isAuthenticated: boolean;
    user: any | null;
    token: string | null;
  };
  ui: {
    theme: string;
    language: string;
    isLoading: boolean;
    error: string | null;
  };
  game: {
    currentGame: any | null;
    games: any[];
    isPlaying: boolean;
  };
  tournament: {
    currentTournament: any | null;
    tournaments: any[];
    isParticipating: boolean;
  };
}

// Initial state
const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem(Config.STORAGE.AUTH_TOKEN),
  },
  ui: {
    theme: localStorage.getItem(Config.STORAGE.THEME) || Config.THEME.SYSTEM,
    language: localStorage.getItem(Config.STORAGE.LANGUAGE) || "en",
    isLoading: false,
    error: null,
  },
  game: {
    currentGame: null,
    games: [],
    isPlaying: false,
  },
  tournament: {
    currentTournament: null,
    tournaments: [],
    isParticipating: false,
  },
};

// Create and export store instance
export const store = new Store<AppState>(initialState);

// Common selectors
export const selectors = {
  isAuthenticated: (state: AppState) => state.auth.isAuthenticated,
  currentUser: (state: AppState) => state.auth.user,
  theme: (state: AppState) => state.ui.theme,
  isLoading: (state: AppState) => state.ui.isLoading,
  error: (state: AppState) => state.ui.error,
  currentGame: (state: AppState) => state.game.currentGame,
  games: (state: AppState) => state.game.games,
  currentTournament: (state: AppState) => state.tournament.currentTournament,
  tournaments: (state: AppState) => state.tournament.tournaments,
};
