import { RetryMechanism } from './[UTIL]retryMechanism';

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: UserRole[];
  permissions: string[];
}

interface Session {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

interface AuthConfig {
  apiUrl: string;
  tokenRefreshThreshold: number; // Time in ms before expiry to refresh
  sessionStorageKey: string;
}

const DEFAULT_AUTH_CONFIG: AuthConfig = {
  apiUrl: '/api/auth',
  tokenRefreshThreshold: 300000, // 5 minutes
  sessionStorageKey: 'auth_session',
};

export class AuthManager {
  private static instance: AuthManager;
  private config: AuthConfig;
  private currentSession: Session | null = null;
  private refreshPromise: Promise<void> | null = null;
  private retryMechanism: RetryMechanism;

  private constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...DEFAULT_AUTH_CONFIG, ...config };
    this.retryMechanism = new RetryMechanism({
      maxAttempts: 3,
      retryableErrors: ['NETWORK_ERROR', 'TIMEOUT'],
    });
    this.loadSession();
  }

  static getInstance(config?: Partial<AuthConfig>): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager(config);
    }
    return AuthManager.instance;
  }

  private loadSession(): void {
    const savedSession = sessionStorage.getItem(this.config.sessionStorageKey);
    if (savedSession) {
      try {
        this.currentSession = JSON.parse(savedSession);
        if (this.shouldRefreshToken()) {
          this.refreshToken();
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        this.clearSession();
      }
    }
  }

  private saveSession(session: Session): void {
    this.currentSession = session;
    sessionStorage.setItem(
      this.config.sessionStorageKey,
      JSON.stringify(session)
    );
  }

  private clearSession(): void {
    this.currentSession = null;
    sessionStorage.removeItem(this.config.sessionStorageKey);
  }

  private shouldRefreshToken(): boolean {
    if (!this.currentSession) return false;
    const now = Date.now();
    return (
      this.currentSession.expiresAt - now < this.config.tokenRefreshThreshold
    );
  }

  private async refreshToken(): Promise<void> {
    if (!this.currentSession?.refreshToken) {
      throw new Error('No refresh token available');
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.retryMechanism.execute(async () => {
      const response = await fetch(`${this.config.apiUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.currentSession?.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const newSession = await response.json();
      this.saveSession(newSession);
    });

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async login(username: string, password: string): Promise<void> {
    const response = await this.retryMechanism.execute(async () => {
      return fetch(`${this.config.apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const session = await response.json();
    this.saveSession(session);
  }

  async logout(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await this.retryMechanism.execute(async () => {
        await fetch(`${this.config.apiUrl}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.currentSession?.token}`,
          },
        });
      });
    } finally {
      this.clearSession();
    }
  }

  async getAuthenticatedUser(): Promise<User | null> {
    if (!this.currentSession) return null;

    if (this.shouldRefreshToken()) {
      await this.refreshToken();
    }

    return this.currentSession.user;
  }

  hasRole(role: UserRole): boolean {
    return this.currentSession?.user.roles.includes(role) ?? false;
  }

  hasPermission(permission: string): boolean {
    return this.currentSession?.user.permissions.includes(permission) ?? false;
  }

  async requireRole(role: UserRole): Promise<void> {
    const user = await this.getAuthenticatedUser();
    if (!user || !this.hasRole(role)) {
      throw new Error(`Required role ${role} not found`);
    }
  }

  async requirePermission(permission: string): Promise<void> {
    const user = await this.getAuthenticatedUser();
    if (!user || !this.hasPermission(permission)) {
      throw new Error(`Required permission ${permission} not found`);
    }
  }

  getAuthorizationHeader(): string | null {
    return this.currentSession ? `Bearer ${this.currentSession.token}` : null;
  }
}
