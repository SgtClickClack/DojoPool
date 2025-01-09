import stateService from './state';
import analyticsService from './analytics';

interface ModalConfig {
    id: string;
    title: string;
    content: string | HTMLElement;
    size?: 'small' | 'medium' | 'large' | 'full';
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    closeOnEscape?: boolean;
    closeOnOverlayClick?: boolean;
    showCloseButton?: boolean;
    customClass?: string;
    onOpen?: () => void;
    onClose?: () => void;
    buttons?: Array<{
        text: string;
        type?: 'primary' | 'secondary' | 'danger';
        onClick: () => void | Promise<void>;
    }>;
}

interface ModalState {
    isOpen: boolean;
    config: ModalConfig | null;
    stack: ModalConfig[];
}

class ModalService {
    private state: ModalState = {
        isOpen: false,
        config: null,
        stack: []
    };
    private listeners: Set<(state: ModalState) => void> = new Set();
    private escapeListener: (e: KeyboardEvent) => void;

    constructor() {
        this.setupEscapeListener();
    }

    private setupEscapeListener(): void {
        this.escapeListener = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.state.isOpen && this.state.config?.closeOnEscape) {
                this.close();
            }
        };
        window.addEventListener('keydown', this.escapeListener);
    }

    public open(config: ModalConfig): void {
        // Track modal open in analytics
        analyticsService.trackUserEvent({
            type: 'modal_opened',
            userId: 'system',
            details: {
                modalId: config.id,
                timestamp: new Date().toISOString()
            }
        });

        // If there's already an open modal, add it to the stack
        if (this.state.isOpen && this.state.config) {
            this.state.stack.push(this.state.config);
        }

        // Set default values
        const fullConfig: ModalConfig = {
            size: 'medium',
            position: 'center',
            closeOnEscape: true,
            closeOnOverlayClick: true,
            showCloseButton: true,
            ...config
        };

        // Update state
        this.state = {
            ...this.state,
            isOpen: true,
            config: fullConfig
        };

        // Update UI state
        stateService.setState('ui', {
            ...stateService.getState(state => state.ui),
            activeModal: config.id
        });

        // Call onOpen callback
        fullConfig.onOpen?.();

        // Notify listeners
        this.notifyListeners();

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }

    public close(): void {
        if (!this.state.isOpen || !this.state.config) {
            return;
        }

        // Track modal close in analytics
        analyticsService.trackUserEvent({
            type: 'modal_closed',
            userId: 'system',
            details: {
                modalId: this.state.config.id,
                timestamp: new Date().toISOString()
            }
        });

        // Call onClose callback
        this.state.config.onClose?.();

        // Check if there are modals in the stack
        const nextModal = this.state.stack.pop();

        // Update state
        this.state = {
            ...this.state,
            isOpen: Boolean(nextModal),
            config: nextModal || null,
            stack: this.state.stack
        };

        // Update UI state
        stateService.setState('ui', {
            ...stateService.getState(state => state.ui),
            activeModal: nextModal?.id || null
        });

        // Notify listeners
        this.notifyListeners();

        // Restore body scrolling if no modals are open
        if (!this.state.isOpen) {
            document.body.style.overflow = '';
        }
    }

    public closeAll(): void {
        while (this.state.isOpen) {
            this.close();
        }
    }

    public addListener(listener: (state: ModalState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }

    public isOpen(): boolean {
        return this.state.isOpen;
    }

    public getCurrentModal(): ModalConfig | null {
        return this.state.config;
    }

    public getModalStack(): ModalConfig[] {
        return [...this.state.stack];
    }

    public confirm(options: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        confirmType?: 'primary' | 'danger';
    }): Promise<boolean> {
        return new Promise((resolve) => {
            this.open({
                id: 'confirm-dialog',
                title: options.title,
                content: options.message,
                size: 'small',
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        type: 'secondary',
                        onClick: () => {
                            this.close();
                            resolve(false);
                        }
                    },
                    {
                        text: options.confirmText || 'Confirm',
                        type: options.confirmType || 'primary',
                        onClick: () => {
                            this.close();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    }

    public alert(options: {
        title: string;
        message: string;
        buttonText?: string;
    }): Promise<void> {
        return new Promise((resolve) => {
            this.open({
                id: 'alert-dialog',
                title: options.title,
                content: options.message,
                size: 'small',
                buttons: [
                    {
                        text: options.buttonText || 'OK',
                        type: 'primary',
                        onClick: () => {
                            this.close();
                            resolve();
                        }
                    }
                ]
            });
        });
    }

    public prompt(options: {
        title: string;
        message: string;
        defaultValue?: string;
        confirmText?: string;
        cancelText?: string;
    }): Promise<string | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = options.defaultValue || '';
            input.className = 'modal-prompt-input';

            this.open({
                id: 'prompt-dialog',
                title: options.title,
                content: `
                    <div>
                        <p>${options.message}</p>
                        ${input.outerHTML}
                    </div>
                `,
                size: 'small',
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        type: 'secondary',
                        onClick: () => {
                            this.close();
                            resolve(null);
                        }
                    },
                    {
                        text: options.confirmText || 'OK',
                        type: 'primary',
                        onClick: () => {
                            const inputElement = document.querySelector('.modal-prompt-input') as HTMLInputElement;
                            this.close();
                            resolve(inputElement.value);
                        }
                    }
                ]
            });
        });
    }
}

// Create a singleton instance
const modalService = new ModalService();

export default modalService;
