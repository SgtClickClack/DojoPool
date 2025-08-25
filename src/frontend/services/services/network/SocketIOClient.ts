/*
 Real Socket.IO client wrapper for the frontend
 - Auto-connects and reconnects
 - Exposes on/off helpers and a subscribe() convenience that returns an unsubscribe fn
 - Emits connection status through the special "__client_status__" channel so UIs can reflect status
 - Uses env-configurable URL with sensible local defaults
*/

import { getSocketIOUrl } from '@/config/urls';
import { io, type Socket } from 'socket.io-client';

function resolveSocketUrl(): string {
  return getSocketIOUrl();
}

export class SocketIOService {
  private static socket: Socket | null = null;
  private static url: string = resolveSocketUrl();
  // Internal lightweight event listeners registry for client-side status events
  private static listeners: Map<string, Set<(data: any) => void>> = new Map();

  private static emitLocal(event: string, payload: any) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(payload);
      } catch {}
    }
  }

  private static ensure(): Socket {
    if (!this.socket) {
      this.socket = io(this.url, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        withCredentials: true,
      });

      this.socket.on('connect', () =>
        this.emitLocal('__client_status__', { status: 'connected' })
      );
      this.socket.on('disconnect', (reason) =>
        this.emitLocal('__client_status__', { status: 'disconnected', reason })
      );
      this.socket.on('connect_error', (error) =>
        this.emitLocal('__client_status__', { status: 'error', error })
      );
    }
    return this.socket;
  }

  static reconnect(): void {
    const s = this.ensure();
    if (s.connected) return;
    s.connect();
  }

  static disconnect(): void {
    this.socket?.disconnect();
  }

  static emit<T = any>(event: string, payload?: T): void {
    this.ensure().emit(event, payload as any);
  }

  static on<T = any>(event: string, callback: (data: T) => void): void {
    if (event === '__client_status__') {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event)!.add(callback as any);
      return;
    }
    this.ensure().on(event, callback as any);
  }

  static off(event: string, callback?: (data: any) => void): void {
    if (event === '__client_status__') {
      if (!callback) {
        this.listeners.delete(event);
      } else {
        const set = this.listeners.get(event);
        set?.delete(callback as any);
        if (set && set.size === 0) this.listeners.delete(event);
      }
      return;
    }
    const s = this.ensure();
    if (callback) s.off(event, callback as any);
    else s.off(event);
  }

  static subscribe<T = any>(event: string, callback: (data: T) => void) {
    if (event === 'notifications') {
      const relay = (payload: any) => callback(payload as T);
      this.on('__client_status__', relay);
      this.on('notification', relay);
      return () => {
        this.off('__client_status__', relay);
        this.off('notification', relay);
      };
    }

    this.on(event, callback);
    return () => this.off(event, callback);
  }
}
