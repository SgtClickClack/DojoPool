import stateService from './state';
import analyticsService from './analytics';

interface DialogButton {
    text: string;
    type?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    onClick: () => void | Promise<void>;
}

interface DialogConfig {
    id: string;
    title: string;
    content: string | HTMLElement;
    buttons?: DialogButton[];
    size?: 'small' | 'medium' | 'large' | 'full';
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    closeOnEscape?: boolean;
    closeOnOverlayClick?: boolean;
    showCloseButton?: boolean;
    customClass?: string;
    draggable?: boolean;
    resizable?: boolean;
    fullscreen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onResize?: () => void;
}

interface DialogState {
    dialogs: Map<string, DialogConfig>;
    activeDialog: string | null;
    dialogStack: string[];
}

class DialogService {
    private state: DialogState = {
        dialogs: new Map(),
        activeDialog: null,
        dialogStack: []
    };
    private listeners: Set<(state: DialogState) => void> = new Set();

    constructor() {
        this.setupKeyboardListener();
    }

    private setupKeyboardListener(): void {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const activeDialog = this.getActiveDialog();
                if (activeDialog?.closeOnEscape) {
                    this.close(activeDialog.id);
                }
            }
        });
    }

    public open(config: Omit<DialogConfig, 'id'>): string {
        const id = `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const dialogConfig: DialogConfig = {
            ...config,
            id,
            closeOnEscape: config.closeOnEscape ?? true,
            closeOnOverlayClick: config.closeOnOverlayClick ?? true,
            showCloseButton: config.showCloseButton ?? true,
            size: config.size || 'medium',
            position: config.position || 'center'
        };

        this.state.dialogs.set(id, dialogConfig);
        this.state.dialogStack.push(id);
        this.state.activeDialog = id;

        // Call onOpen callback
        dialogConfig.onOpen?.();

        // Notify listeners
        this.notifyListeners();

        // Track dialog opened
        analyticsService.trackUserEvent({
            type: 'dialog_opened',
            userId: 'system',
            details: {
                dialogId: id,
                title: dialogConfig.title,
                timestamp: new Date().toISOString()
            }
        });

        return id;
    }

    public close(id: string): void {
        const dialog = this.state.dialogs.get(id);
        if (!dialog) {
            return;
        }

        // Call onClose callback
        dialog.onClose?.();

        // Remove from state
        this.state.dialogs.delete(id);
        this.state.dialogStack = this.state.dialogStack.filter(dialogId => dialogId !== id);
        this.state.activeDialog = this.state.dialogStack[this.state.dialogStack.length - 1] || null;

        // Notify listeners
        this.notifyListeners();

        // Track dialog closed
        analyticsService.trackUserEvent({
            type: 'dialog_closed',
            userId: 'system',
            details: {
                dialogId: id,
                title: dialog.title,
                timestamp: new Date().toISOString()
            }
        });
    }

    public closeAll(): void {
        const dialogCount = this.state.dialogs.size;
        if (dialogCount > 0) {
            // Call onClose callbacks
            this.state.dialogs.forEach(dialog => dialog.onClose?.());

            // Clear state
            this.state.dialogs.clear();
            this.state.dialogStack = [];
            this.state.activeDialog = null;

            // Notify listeners
            this.notifyListeners();

            // Track all dialogs closed
            analyticsService.trackUserEvent({
                type: 'all_dialogs_closed',
                userId: 'system',
                details: {
                    count: dialogCount,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    public confirm(options: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        confirmType?: DialogButton['type'];
        size?: DialogConfig['size'];
    }): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.open({
                title: options.title,
                content: options.message,
                size: options.size || 'small',
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        type: 'secondary',
                        onClick: () => {
                            resolve(false);
                            this.close(this.state.activeDialog!);
                        }
                    },
                    {
                        text: options.confirmText || 'Confirm',
                        type: options.confirmType || 'primary',
                        onClick: () => {
                            resolve(true);
                            this.close(this.state.activeDialog!);
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
        placeholder?: string;
        confirmText?: string;
        cancelText?: string;
        validator?: (value: string) => boolean | string;
    }): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'dialog-prompt-input';
            input.value = options.defaultValue || '';
            input.placeholder = options.placeholder || '';

            const content = document.createElement('div');
            content.className = 'dialog-prompt-content';
            content.innerHTML = `<p>${options.message}</p>`;
            content.appendChild(input);

            this.open({
                title: options.title,
                content,
                size: 'small',
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        type: 'secondary',
                        onClick: () => {
                            resolve(null);
                            this.close(this.state.activeDialog!);
                        }
                    },
                    {
                        text: options.confirmText || 'OK',
                        type: 'primary',
                        onClick: () => {
                            const value = input.value;
                            if (options.validator) {
                                const validationResult = options.validator(value);
                                if (validationResult !== true) {
                                    const errorMessage = typeof validationResult === 'string'
                                        ? validationResult
                                        : 'Invalid input';
                                    input.setCustomValidity(errorMessage);
                                    input.reportValidity();
                                    return;
                                }
                            }
                            resolve(value);
                            this.close(this.state.activeDialog!);
                        }
                    }
                ]
            });

            // Focus input after dialog is opened
            setTimeout(() => input.focus(), 100);
        });
    }

    public getDialog(id: string): DialogConfig | undefined {
        return this.state.dialogs.get(id);
    }

    public getActiveDialog(): DialogConfig | undefined {
        return this.state.activeDialog
            ? this.state.dialogs.get(this.state.activeDialog)
            : undefined;
    }

    public updateDialog(id: string, updates: Partial<DialogConfig>): void {
        const dialog = this.state.dialogs.get(id);
        if (dialog) {
            this.state.dialogs.set(id, { ...dialog, ...updates });
            this.notifyListeners();

            // Track dialog updated
            analyticsService.trackUserEvent({
                type: 'dialog_updated',
                userId: 'system',
                details: {
                    dialogId: id,
                    updates: Object.keys(updates),
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    public setDialogButton(
        id: string,
        index: number,
        updates: Partial<DialogButton>
    ): void {
        const dialog = this.state.dialogs.get(id);
        if (dialog && dialog.buttons && dialog.buttons[index]) {
            dialog.buttons[index] = {
                ...dialog.buttons[index],
                ...updates
            };
            this.notifyListeners();

            // Track button updated
            analyticsService.trackUserEvent({
                type: 'dialog_button_updated',
                userId: 'system',
                details: {
                    dialogId: id,
                    buttonIndex: index,
                    updates: Object.keys(updates),
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    public addListener(listener: (state: DialogState) => void): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// Create a singleton instance
const dialogService = new DialogService();

export default dialogService;
