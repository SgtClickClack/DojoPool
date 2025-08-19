import analyticsService from '@/services/analytics';
import stateService from '@/services/state';

interface ToastConfig {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  showProgress?: boolean;
  showIcon?: boolean;
  showCloseButton?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

interface ToastState {
  toasts: ToastConfig[];
  maxToasts: number;
}

class ToastService {
  private state: ToastState = {
    toasts: [],
    maxToasts: 5,
  };
  private listeners: Set<(state: ToastState) => void> = new Set();
  private defaultConfig: Partial<ToastConfig> = {
    type: 'info',
    duration: 5000,
    position: 'top-right',
    showProgress: true,
    showIcon: true,
    showCloseButton: true,
  };

  constructor() {
    this.setupStateListener();
  }

  private setupStateListener(): void {
    stateService.select(
      (state) => state.ui.notifications,
      (notifications) => {
        notifications.forEach((notification) => {
          if (
            !this.state.toasts.some((toast) => toast.id === notification.id)
          ) {
            this.show({
              id: notification.id,
              type: notification.type,
              message: notification.message,
              title: notification.title,
            });
          }
        });
      }
    );
  }

  public show(config: Partial<ToastConfig>): void {
    const id = config.id || `toast-${Date.now()}`;
    const fullConfig: ToastConfig = {
      ...this.defaultConfig,
      ...config,
      id,
    };

    // Track toast display in analytics
    analyticsService.trackUserEvent({
      type: 'toast_displayed',
      userId: 'system',
      details: {
        toastId: id,
        toastType: fullConfig.type,
        timestamp: new Date().toISOString(),
      },
    });

    // Add toast to state
    this.state.toasts.push(fullConfig);

    // Remove excess toasts
    if (this.state.toasts.length > this.state.maxToasts) {
      const removedToasts = this.state.toasts.splice(
        0,
        this.state.toasts.length - this.state.maxToasts
      );
      removedToasts.forEach((toast) => toast.onClose?.());
    }

    // Notify listeners
    this.notifyListeners();

    // Set up auto-dismiss
    if (fullConfig.duration && fullConfig.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, fullConfig.duration);
    }
  }

  public success(message: string, config: Partial<ToastConfig> = {}): void {
    this.show({
      ...config,
      type: 'success',
      message,
    });
  }

  public error(message: string, config: Partial<ToastConfig> = {}): void {
    this.show({
      ...config,
      type: 'error',
      message,
    });
  }

  public warning(message: string, config: Partial<ToastConfig> = {}): void {
    this.show({
      ...config,
      type: 'warning',
      message,
    });
  }

  public info(message: string, config: Partial<ToastConfig> = {}): void {
    this.show({
      ...config,
      type: 'info',
      message,
    });
  }

  public dismiss(id: string): void {
    const toast = this.state.toasts.find((t) => t.id === id);
    if (!toast) {
      return;
    }

    // Track toast dismissal in analytics
    analyticsService.trackUserEvent({
      type: 'toast_dismissed',
      userId: 'system',
      details: {
        toastId: id,
        toastType: toast.type,
        timestamp: new Date().toISOString(),
      },
    });

    // Remove toast from state
    this.state.toasts = this.state.toasts.filter((t) => t.id !== id);

    // Call onClose callback
    toast.onClose?.();

    // Notify listeners
    this.notifyListeners();
  }

  public dismissAll(): void {
    this.state.toasts.forEach((toast) => {
      toast.onClose?.();
    });
    this.state.toasts = [];
    this.notifyListeners();
  }

  public addListener(listener: (state: ToastState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public getToasts(): ToastConfig[] {
    return [...this.state.toasts];
  }

  public setMaxToasts(max: number): void {
    this.state.maxToasts = max;
    if (this.state.toasts.length > max) {
      const removedToasts = this.state.toasts.splice(
        0,
        this.state.toasts.length - max
      );
      removedToasts.forEach((toast) => toast.onClose?.());
      this.notifyListeners();
    }
  }

  public getMaxToasts(): number {
    return this.state.maxToasts;
  }

  public setDefaultConfig(config: Partial<ToastConfig>): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config,
    };
  }

  public getDefaultConfig(): Partial<ToastConfig> {
    return { ...this.defaultConfig };
  }
}

// Create a singleton instance
const toastService = new ToastService();

export default toastService;
