import { Socket } from 'socket.io-client';

declare module 'socket.io-client' {
  interface ManagerOptions {
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    auth?: {
      token?: string | null;
    };
  }

  interface Socket {
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    emit(event: string, ...args: any[]): void;
    disconnect(): void;
  }
}

declare global {
  interface Window {
    socketManager: any;
    websocketManager: any;
  }
}

export {};
