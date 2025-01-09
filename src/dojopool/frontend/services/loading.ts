import stateService from './state';
import analyticsService from './analytics';

interface LoadingState {
    isLoading: boolean;
    loadingStates: Map<string, boolean>;
    loadingMessages: Map<string, string>;
    loadingProgress: Map<string, number>;
    globalLoadingCount: number;
}

class LoadingService {
    private state: LoadingState = {
        isLoading: false,
        loadingStates: new Map(),
        loadingMessages: new Map(),
        loadingProgress: new Map(),
        globalLoadingCount: 0
    };
    private listeners: Set<(state: LoadingState) => void> = new Set();
    private progressIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.setupStateListener();
    }

    private setupStateListener(): void {
        stateService.select(
            state => state.ui.loadingStates,
            (loadingStates) => {
                Object.entries(loadingStates).forEach(([key, value]) => {
                    if (value && !this.state.loadingStates.has(key)) {
                        this.start(key);
                    } else if (!value && this.state.loadingStates.has(key)) {
                        this.stop(key);
                    }
                });
            }
        );
    }

    public start(key: string, options: {
        message?: string;
        showProgress?: boolean;
        progressInterval?: number;
    } = {}): void {
        if (this.state.loadingStates.get(key)) {
            return;
        }

        // Track loading start in analytics
        analyticsService.trackUserEvent({
            type: 'loading_started',
            userId: 'system',
            details: {
                loadingKey: key,
                timestamp: new Date().toISOString()
            }
        });

        // Update state
        this.state.loadingStates.set(key, true);
        if (options.message) {
            this.state.loadingMessages.set(key, options.message);
        }
        this.state.loadingProgress.set(key, 0);
        this.state.globalLoadingCount++;
        this.state.isLoading = true;

        // Update UI state
        stateService.setState('ui', {
            ...stateService.getState(state => state.ui),
            loadingStates: {
                ...stateService.getState(state => state.ui.loadingStates),
                [key]: true
            }
        });

        // Set up progress simulation if requested
        if (options.showProgress) {
            const interval = setInterval(() => {
                const currentProgress = this.state.loadingProgress.get(key) || 0;
                if (currentProgress < 90) {
                    const increment = Math.random() * 10;
                    const newProgress = Math.min(90, currentProgress + increment);
                    this.updateProgress(key, newProgress);
                }
            }, options.progressInterval || 500);
            this.progressIntervals.set(key, interval);
        }

        // Notify listeners
        this.notifyListeners();
    }

    public stop(key: string): void {
        if (!this.state.loadingStates.get(key)) {
            return;
        }

        // Track loading stop in analytics
        analyticsService.trackUserEvent({
            type: 'loading_stopped',
            userId: 'system',
            details: {
                loadingKey: key,
                duration: this.getLoadingDuration(key),
                timestamp: new Date().toISOString()
            }
        });

        // Clear progress interval if exists
        const interval = this.progressIntervals.get(key);
        if (interval) {
            clearInterval(interval);
            this.progressIntervals.delete(key);
        }

        // Update state
        this.state.loadingStates.delete(key);
        this.state.loadingMessages.delete(key);
        this.state.loadingProgress.delete(key);
        this.state.globalLoadingCount--;
        this.state.isLoading = this.state.globalLoadingCount > 0;

        // Update UI state
        stateService.setState('ui', {
            ...stateService.getState(state => state.ui),
            loadingStates: {
                ...stateService.getState(state => state.ui.loadingStates),
                [key]: false
            }
        });

        // Notify listeners
        this.notifyListeners();
    }

    public updateProgress(key: string, progress: number): void {
        if (!this.state.loadingStates.get(key)) {
            return;
        }

        const normalizedProgress = Math.max(0, Math.min(100, progress));
        this.state.loadingProgress.set(key, normalizedProgress);

        if (normalizedProgress === 100) {
            this.stop(key);
        } else {
            this.notifyListeners();
        }
    }

    public updateMessage(key: string, message: string): void {
        if (!this.state.loadingStates.get(key)) {
            return;
        }

        this.state.loadingMessages.set(key, message);
        this.notifyListeners();
    }

    public isLoading(key?: string): boolean {
        if (key) {
            return Boolean(this.state.loadingStates.get(key));
        }
        return this.state.isLoading;
    }

    public getMessage(key: string): string | undefined {
        return this.state.loadingMessages.get(key);
    }

    public getProgress(key: string): number {
        return this.state.loadingProgress.get(key) || 0;
    }

    public getLoadingKeys(): string[] {
        return Array.from(this.state.loadingStates.keys());
    }

    public getGlobalLoadingCount(): number {
        return this.state.globalLoadingCount;
    }

    private getLoadingDuration(key: string): number {
        const startTime = this.state.loadingStates.get(key)
            ? new Date().getTime()
            : undefined;
        return startTime ? new Date().getTime() - startTime : 0;
    }

    public addListener(listener: (state: LoadingState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }

    public reset(): void {
        // Clear all intervals
        this.progressIntervals.forEach(interval => clearInterval(interval));
        this.progressIntervals.clear();

        // Reset state
        this.state = {
            isLoading: false,
            loadingStates: new Map(),
            loadingMessages: new Map(),
            loadingProgress: new Map(),
            globalLoadingCount: 0
        };

        // Update UI state
        stateService.setState('ui', {
            ...stateService.getState(state => state.ui),
            loadingStates: {}
        });

        // Notify listeners
        this.notifyListeners();
    }
}

// Create a singleton instance
const loadingService = new LoadingService();

export default loadingService;
