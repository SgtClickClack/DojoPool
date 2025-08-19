import { analyticsService } from './analytics';

// Mock state service for development
const stateService = {
  get: (key: string) => null,
  set: (key: string, value: any) => {},
  subscribe: (callback: (state: any) => void) => () => {},
};

interface KeyBinding {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
  global?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

interface KeyboardState {
  bindings: Map<string, KeyBinding>;
  pressedKeys: Set<string>;
  isRecording: boolean;
  recordedSequence: string[];
  lastKeyPress: number;
}

class KeyboardService {
  private state: KeyboardState = {
    bindings: new Map(),
    pressedKeys: new Set(),
    isRecording: false,
    recordedSequence: [],
    lastKeyPress: 0,
  };
  private listeners: Set<(event: KeyboardEvent) => void> = new Set();
  private sequenceTimeout: number = 1000; // Time window for key sequences in ms

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = this.normalizeKey(event.key);
    this.state.pressedKeys.add(key);

    // Check if we're recording a sequence
    if (this.state.isRecording) {
      this.state.recordedSequence.push(this.getKeyCombo());
      return;
    }

    // Handle key sequence timing
    const now = Date.now();
    if (now - this.state.lastKeyPress > this.sequenceTimeout) {
      this.state.recordedSequence = [];
    }
    this.state.lastKeyPress = now;
    this.state.recordedSequence.push(this.getKeyCombo());

    // Find and execute matching bindings
    const combo = this.getKeyCombo();
    const sequence = this.state.recordedSequence.join(' ');
    this.executeBinding(combo, sequence, event);

    // Notify listeners
    this.listeners.forEach((listener) => listener(event));

    // Track key press in analytics
    analyticsService.trackEvent('key_pressed', {
      userId: 'system',
      key: combo,
      sequence,
      timestamp: new Date().toISOString(),
    });
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = this.normalizeKey(event.key);
    this.state.pressedKeys.delete(key);
  }

  private handleBlur(): void {
    this.state.pressedKeys.clear();
  }

  private normalizeKey(key: string): string {
    // Normalize key names for consistency
    switch (key) {
      case ' ':
        return 'Space';
      case 'Escape':
        return 'Esc';
      case 'Control':
        return 'Ctrl';
      case 'ArrowUp':
        return 'Up';
      case 'ArrowDown':
        return 'Down';
      case 'ArrowLeft':
        return 'Left';
      case 'ArrowRight':
        return 'Right';
      default:
        return key.length === 1 ? key.toUpperCase() : key;
    }
  }

  private getKeyCombo(): string {
    const modifiers: string[] = [];
    if (this.state.pressedKeys.has('Ctrl')) modifiers.push('Ctrl');
    if (this.state.pressedKeys.has('Shift')) modifiers.push('Shift');
    if (this.state.pressedKeys.has('Alt')) modifiers.push('Alt');
    if (this.state.pressedKeys.has('Meta')) modifiers.push('Meta');

    const keys = Array.from(this.state.pressedKeys).filter(
      (key) => !['Ctrl', 'Shift', 'Alt', 'Meta'].includes(key)
    );

    return [...modifiers, ...keys].join('+');
  }

  private executeBinding(
    combo: string,
    sequence: string,
    event: KeyboardEvent
  ): void {
    this.state.bindings.forEach((binding) => {
      if (binding.disabled) return;

      const bindingCombo = this.buildBindingCombo(binding);
      const isMatch = binding.key.includes(' ')
        ? sequence === binding.key
        : combo === bindingCombo;

      if (isMatch) {
        if (binding.preventDefault) {
          event.preventDefault();
        }
        if (binding.stopPropagation) {
          event.stopPropagation();
        }

        // Track binding execution in analytics
        analyticsService.trackEvent('keyboard_binding_executed', {
          userId: 'system',
          bindingId: binding.id,
          combo,
          sequence,
          timestamp: new Date().toISOString(),
        });

        binding.action();
        return;
      }
    });
  }

  private buildBindingCombo(binding: KeyBinding): string {
    const modifiers: string[] = [];
    if (binding.ctrl) modifiers.push('Ctrl');
    if (binding.shift) modifiers.push('Shift');
    if (binding.alt) modifiers.push('Alt');
    if (binding.meta) modifiers.push('Meta');
    return [...modifiers, binding.key].join('+');
  }

  public bind(binding: KeyBinding): void {
    if (this.state.bindings.has(binding.id)) {
      throw new Error(`Binding with id ${binding.id} already exists`);
    }

    this.state.bindings.set(binding.id, binding);

    // Track binding registration in analytics
    analyticsService.trackEvent('keyboard_binding_registered', {
      userId: 'system',
      bindingId: binding.id,
      category: binding.category,
      timestamp: new Date().toISOString(),
    });
  }

  public unbind(id: string): void {
    this.state.bindings.delete(id);

    // Track binding removal in analytics
    analyticsService.trackEvent('keyboard_binding_unregistered', {
      userId: 'system',
      bindingId: id,
      timestamp: new Date().toISOString(),
    });
  }

  public getBinding(id: string): KeyBinding | undefined {
    return this.state.bindings.get(id);
  }

  public getBindings(): KeyBinding[] {
    return Array.from(this.state.bindings.values());
  }

  public getBindingsByCategory(category: string): KeyBinding[] {
    return Array.from(this.state.bindings.values()).filter(
      (binding) => binding.category === category
    );
  }

  public setBindingEnabled(id: string, enabled: boolean): void {
    const binding = this.state.bindings.get(id);
    if (binding) {
      binding.disabled = !enabled;
    }
  }

  public startRecording(): void {
    this.state.isRecording = true;
    this.state.recordedSequence = [];
  }

  public stopRecording(): string[] {
    this.state.isRecording = false;
    return [...this.state.recordedSequence];
  }

  public isRecording(): boolean {
    return this.state.isRecording;
  }

  public addListener(listener: (event: KeyboardEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public setSequenceTimeout(timeout: number): void {
    this.sequenceTimeout = timeout;
  }

  public getSequenceTimeout(): number {
    return this.sequenceTimeout;
  }

  public reset(): void {
    this.state.bindings.clear();
    this.state.pressedKeys.clear();
    this.state.recordedSequence = [];
    this.state.isRecording = false;
    this.state.lastKeyPress = 0;
  }
}

// Create a singleton instance
const keyboardService = new KeyboardService();

export default keyboardService;
