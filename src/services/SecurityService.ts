import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface SecurityConfig {
    apiEndpoint?: string;
    tokenRefreshThreshold?: number;
    maxTokenAge?: number;
    storagePrefix?: string;
    secureCookies?: boolean;
    csrfHeaderName?: string;
}

interface UserToken {
    sub: string;
    username: string;
    roles: string[];
    permissions: string[];
    exp: number;
}

interface AuthState {
    isAuthenticated: boolean;
    user: UserToken | null;
    loading: boolean;
    error: Error | null;
}

class SecurityService {
    private static instance: SecurityService;
    private subscribers: ((state: AuthState) => void)[] = [];
    private refreshTimeout: NodeJS.Timeout | null = null;
    private csrfToken: string | null = null;

    private config: Required<SecurityConfig> = {
        apiEndpoint: '/api/auth',
        tokenRefreshThreshold: 5 * 60, // 5 minutes in seconds
        maxTokenAge: 24 * 60 * 60, // 24 hours in seconds
        storagePrefix: 'dojo_pool_',
        secureCookies: true,
        csrfHeaderName: 'X-CSRF-Token'
    };

    private state: AuthState = {
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null
    };

    private constructor(config: SecurityConfig = {}) {
        this.config = { ...this.config, ...config };
        this.initialize();
    }

    public static getInstance(config?: SecurityConfig): SecurityService {
        if (!SecurityService.instance) {
            SecurityService.instance = new SecurityService(config);
        }
        return SecurityService.instance;
    }

    private async initialize() {
        try {
            const token = this.getStoredToken();
            if (token) {
                await this.validateAndRefreshToken(token);
            } else {
                this.updateState({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: null
                });
            }
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private updateState(newState: Partial<AuthState>) {
        this.state = { ...this.state, ...newState };
        this.notifySubscribers();
    }

    private notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }

    public subscribe(callback: (state: AuthState) => void) {
        this.subscribers.push(callback);
        callback(this.state); // Initial callback
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    public async login(username: string, password: string) {
        try {
            const response = await fetch(`${this.config.apiEndpoint}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getCsrfHeader()
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const { token } = await response.json();
            await this.handleNewToken(token);
        } catch (error) {
            this.handleError(error as Error);
            throw error;
        }
    }

    public async logout() {
        try {
            await fetch(`${this.config.apiEndpoint}/logout`, {
                method: 'POST',
                headers: this.getCsrfHeader(),
                credentials: 'include'
            });
        } finally {
            this.clearAuth();
        }
    }

    private async handleNewToken(token: string) {
        try {
            const user = this.decodeToken(token);
            this.storeToken(token);
            this.scheduleTokenRefresh(user.exp);
            
            this.updateState({
                isAuthenticated: true,
                user,
                loading: false,
                error: null
            });
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private async validateAndRefreshToken(token: string) {
        try {
            const user = this.decodeToken(token);
            const now = Math.floor(Date.now() / 1000);

            if (now >= user.exp) {
                // Token expired
                this.clearAuth();
                return;
            }

            if (user.exp - now <= this.config.tokenRefreshThreshold) {
                // Token needs refresh
                await this.refreshToken();
            } else {
                this.scheduleTokenRefresh(user.exp);
                this.updateState({
                    isAuthenticated: true,
                    user,
                    loading: false,
                    error: null
                });
            }
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private async refreshToken() {
        try {
            const response = await fetch(`${this.config.apiEndpoint}/refresh`, {
                method: 'POST',
                headers: this.getCsrfHeader(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const { token } = await response.json();
            await this.handleNewToken(token);
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    private scheduleTokenRefresh(expTime: number) {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        const now = Math.floor(Date.now() / 1000);
        const refreshTime = expTime - this.config.tokenRefreshThreshold;
        
        if (refreshTime > now) {
            this.refreshTimeout = setTimeout(
                () => this.refreshToken(),
                (refreshTime - now) * 1000
            );
        }
    }

    private decodeToken(token: string): UserToken {
        try {
            return jwtDecode<UserToken>(token);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    private handleError(error: Error) {
        console.error('Security service error:', error);
        this.updateState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error
        });
    }

    private clearAuth() {
        localStorage.removeItem(this.getTokenKey());
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        this.updateState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null
        });
    }

    private getTokenKey() {
        return `${this.config.storagePrefix}auth_token`;
    }

    private storeToken(token: string) {
        localStorage.setItem(this.getTokenKey(), token);
    }

    private getStoredToken(): string | null {
        return localStorage.getItem(this.getTokenKey());
    }

    public async fetchCsrfToken() {
        try {
            const response = await fetch(`${this.config.apiEndpoint}/csrf`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch CSRF token');
            }
            
            const { token } = await response.json();
            this.csrfToken = token;
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
        }
    }

    private getCsrfHeader() {
        return this.csrfToken ? {
            [this.config.csrfHeaderName]: this.csrfToken
        } : {};
    }

    public hasPermission(permission: string): boolean {
        return this.state.user?.permissions.includes(permission) || false;
    }

    public hasRole(role: string): boolean {
        return this.state.user?.roles.includes(role) || false;
    }
}

// React hook for using security service
export const useAuth = () => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        const security = SecurityService.getInstance();
        return security.subscribe(setState);
    }, []);

    return {
        ...state,
        login: (username: string, password: string) => 
            SecurityService.getInstance().login(username, password),
        logout: () => SecurityService.getInstance().logout(),
        hasPermission: (permission: string) => 
            SecurityService.getInstance().hasPermission(permission),
        hasRole: (role: string) => 
            SecurityService.getInstance().hasRole(role)
    };
};

export default SecurityService; 