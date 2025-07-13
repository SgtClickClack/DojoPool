// Browser-compatible EventEmitter replacement for Node.js EventEmitter
// Use this instead of importing from 'events' in frontend code

export class BrowserEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  removeListener(event: string, listener: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.removeListener(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  listenerCount(event: string): number {
    return this.listeners[event] ? this.listeners[event].length : 0;
  }

  eventNames(): string[] {
    return Object.keys(this.listeners);
  }
} 