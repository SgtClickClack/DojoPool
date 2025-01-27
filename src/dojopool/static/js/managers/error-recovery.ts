import { BaseManager } from './base-manager';

export class RecoveryError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(message);
        this.name = 'RecoveryError';
        // Restore prototype chain for instanceof to work
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export interface RecoveryStrategy {
    name: string;
    pattern: RegExp;
    handler: () => Promise<boolean>;
    maxAttempts?: number;
    cooldownMs?: number;
}

export interface RecoveryHistoryEntry {
    timestamp: number;
    error: string;
    strategy: string;
    success: boolean;
    attemptCount: number;
}

export class ErrorRecoveryManager extends BaseManager<ErrorRecoveryManager> {
    private readonly recoveryStrategies: Map<string, RecoveryStrategy>;
    private readonly recoveryHistory: RecoveryHistoryEntry[];
    private readonly maxHistorySize: number = 100;
    private readonly attemptCounts: Map<string, number>;
    private readonly lastAttempts: Map<string, number>;

    protected constructor() {
        super();
        this.recoveryStrategies = new Map();
        this.recoveryHistory = [];
        this.attemptCounts = new Map();
        this.lastAttempts = new Map();
    }

    public static override getInstance(): ErrorRecoveryManager {
        return BaseManager.getInstance.call(ErrorRecoveryManager);
    }

    public registerStrategy(strategy: RecoveryStrategy): void {
        if (this.recoveryStrategies.has(strategy.name)) {
            throw new RecoveryError(`Strategy ${strategy.name} already exists`);
        }
        this.recoveryStrategies.set(strategy.name, strategy);
        this.attemptCounts.set(strategy.name, 0);
    }

    public async handleError(error: Error): Promise<boolean> {
        const errorString = error.toString();
        let handled = false;

        for (const strategy of this.recoveryStrategies.values()) {
            if (strategy.pattern.test(errorString)) {
                if (!this.canAttemptRecovery(strategy)) {
                    continue;
                }

                try {
                    handled = await this.executeStrategy(strategy, errorString);
                    if (handled) break;
                } catch (recoveryError) {
                    this.addToHistory({
                        timestamp: Date.now(),
                        error: errorString,
                        strategy: strategy.name,
                        success: false,
                        attemptCount: this.attemptCounts.get(strategy.name) || 0
                    });
                    throw new RecoveryError(
                        `Recovery strategy ${strategy.name} failed`,
                        recoveryError instanceof Error ? recoveryError : undefined
                    );
                }
            }
        }

        return handled;
    }

    private canAttemptRecovery(strategy: RecoveryStrategy): boolean {
        const currentAttempts = this.attemptCounts.get(strategy.name) || 0;
        const lastAttempt = this.lastAttempts.get(strategy.name) || 0;
        const now = Date.now();

        if (strategy.maxAttempts && currentAttempts >= strategy.maxAttempts) {
            return false;
        }

        if (strategy.cooldownMs && now - lastAttempt < strategy.cooldownMs) {
            return false;
        }

        return true;
    }

    private async executeStrategy(strategy: RecoveryStrategy, errorString: string): Promise<boolean> {
        const currentAttempts = (this.attemptCounts.get(strategy.name) || 0) + 1;
        this.attemptCounts.set(strategy.name, currentAttempts);
        this.lastAttempts.set(strategy.name, Date.now());

        const handled = await strategy.handler();
        this.addToHistory({
            timestamp: Date.now(),
            error: errorString,
            strategy: strategy.name,
            success: handled,
            attemptCount: currentAttempts
        });

        return handled;
    }

    public getRecoveryHistory(): ReadonlyArray<RecoveryHistoryEntry> {
        return [...this.recoveryHistory];
    }

    private addToHistory(entry: RecoveryHistoryEntry): void {
        this.recoveryHistory.push(entry);
        if (this.recoveryHistory.length > this.maxHistorySize) {
            this.recoveryHistory.shift();
        }
    }

    public override cleanup(): void {
        this.recoveryStrategies.clear();
        this.recoveryHistory.length = 0;
        this.attemptCounts.clear();
        this.lastAttempts.clear();
        this.onCleanup();
    }
} 