import { UserProfile } from "../../types/user";
import { TrainingSession } from "../../types/training";
import storageService from "./storage";
import analyticsService from "./analytics";

interface AppState {
  user: {
    profile: UserProfile | null;
    isAuthenticated: boolean;
    preferences: Record<string, any>;
  };
  training: {
    currentSession: TrainingSession | null;
    recentSessions: TrainingSession[];
    savedTechniques: string[];
  };
  ui: {
    theme: "light" | "dark" | "system";
    sidebarOpen: boolean;
    activeModal: string | null;
    notifications: any[];
    loadingStates: Record<string, boolean>;
    errors: Record<string, string>;
  };
  offline: {
    isOnline: boolean;
    pendingActions: number;
    lastSync: string | null;
  };
  performance: {
    memoryUsage: number;
    loadTimes: Record<string, number>;
    errors: any[];
  };
}

type StateListener<T = any> = (newValue: T, oldValue: T) => void;
type StateSelector<T = any> = (state: AppState) => T;

class StateService {
  private state: AppState = {
    user: {
      profile: null,
      isAuthenticated: false,
      preferences: {},
    },
    training: {
      currentSession: null,
      recentSessions: [],
      savedTechniques: [],
    },
    ui: {
      theme: "system",
      sidebarOpen: false,
      activeModal: null,
      notifications: [],
      loadingStates: {},
      errors: {},
    },
    offline: {
      isOnline: navigator.onLine,
      pendingActions: 0,
      lastSync: null,
    },
    performance: {
      memoryUsage: 0,
      loadTimes: {},
      errors: [],
    },
  };

  private listeners: Map<string, Set<StateListener>> = new Map();
  private persistentKeys: Set<string> = new Set([
    "user.preferences",
    "ui.theme",
  ]);

  constructor() {
    this.initializeState();
    this.setupNetworkListeners();
  }

  private async initializeState(): Promise<void> {
    // Load persistent state from storage
    for (const key of this.persistentKeys) {
      const value = await storageService.getCachedResponse(`state:${key}`);
      if (value !== null) {
        this.setStateByPath(key, value);
      }
    }

    // Track initial state
    analyticsService.trackUserEvent({
      type: "state_initialized",
      userId: "system",
      details: { timestamp: new Date().toISOString() },
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener("online", () => {
      this.setState("offline", { ...this.state.offline, isOnline: true });
    });

    window.addEventListener("offline", () => {
      this.setState("offline", { ...this.state.offline, isOnline: false });
    });
  }

  public select<T>(
    selector: StateSelector<T>,
    listener: StateListener<T>,
  ): () => void {
    const key = selector.toString();
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    const currentValue = selector(this.state);
    const wrappedListener = (newState: AppState, oldState: AppState) => {
      const newValue = selector(newState);
      const oldValue = selector(oldState);
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        listener(newValue, oldValue);
      }
    };

    this.listeners.get(key)!.add(wrappedListener);
    listener(currentValue, currentValue);

    return () => {
      this.listeners.get(key)?.delete(wrappedListener);
      if (this.listeners.get(key)?.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  public getState<T = AppState>(selector?: StateSelector<T>): T {
    if (selector) {
      return selector(this.state);
    }
    return this.state as unknown as T;
  }

  public setState<K extends keyof AppState>(
    key: K,
    value: AppState[K],
    options: { persist?: boolean } = {},
  ): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, [key]: value };

    if (options.persist || this.persistentKeys.has(key as string)) {
      storageService.cacheResponse(`state:${key}`, value);
    }

    this.notifyListeners(this.state, oldState);
  }

  public setStateByPath(
    path: string,
    value: any,
    options: { persist?: boolean } = {},
  ): void {
    const oldState = { ...this.state };
    const pathParts = path.split(".");
    let current: any = this.state;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;

    if (options.persist || this.persistentKeys.has(path)) {
      storageService.cacheResponse(`state:${path}`, value);
    }

    this.notifyListeners(this.state, oldState);
  }

  private notifyListeners(newState: AppState, oldState: AppState): void {
    this.listeners.forEach((listeners) => {
      listeners.forEach((listener) => listener(newState, oldState));
    });
  }

  public resetState(): void {
    const oldState = this.state;
    this.state = this.getInitialState();
    this.notifyListeners(this.state, oldState);

    // Clear persistent state
    this.persistentKeys.forEach((key) => {
      storageService.removeOfflineAction(`state:${key}`);
    });
  }

  private getInitialState(): AppState {
    return {
      user: {
        profile: null,
        isAuthenticated: false,
        preferences: {},
      },
      training: {
        currentSession: null,
        recentSessions: [],
        savedTechniques: [],
      },
      ui: {
        theme: "system",
        sidebarOpen: false,
        activeModal: null,
        notifications: [],
        loadingStates: {},
        errors: {},
      },
      offline: {
        isOnline: navigator.onLine,
        pendingActions: 0,
        lastSync: null,
      },
      performance: {
        memoryUsage: 0,
        loadTimes: {},
        errors: [],
      },
    };
  }

  public addPersistentKey(key: string): void {
    this.persistentKeys.add(key);
    const value = this.getStateByPath(key);
    if (value !== undefined) {
      storageService.cacheResponse(`state:${key}`, value);
    }
  }

  public removePersistentKey(key: string): void {
    this.persistentKeys.delete(key);
    storageService.removeOfflineAction(`state:${key}`);
  }

  private getStateByPath(path: string): any {
    const pathParts = path.split(".");
    let current: any = this.state;

    for (const part of pathParts) {
      if (current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  public batch(updates: Array<{ path: string; value: any }>): void {
    const oldState = { ...this.state };

    updates.forEach(({ path, value }) => {
      this.setStateByPath(path, value, { persist: false });
    });

    // Persist all changes at once for better performance
    updates.forEach(({ path, value }) => {
      if (this.persistentKeys.has(path)) {
        storageService.cacheResponse(`state:${path}`, value);
      }
    });

    this.notifyListeners(this.state, oldState);
  }
}

// Create a singleton instance
const stateService = new StateService();

export default stateService;
