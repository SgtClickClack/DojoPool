/*
 Real Socket.IO client wrapper for the frontend
 - Auto-connects and reconnects
 - Exposes on/off helpers and a subscribe() convenience that returns an unsubscribe fn
 - Emits connection status through the special "__client_status__" channel so UIs can reflect status
 - Uses env-configurable URL with sensible local defaults
*/

import { io, type Socket } from 'socket.io-client';

function resolveSocketUrl(): string {
  const url =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_WS_URL)) ||
    (typeof process !== 'undefined' &&
      (process.env.VITE_SOCKET_URL as string | undefined)) ||
    (typeof window !== 'undefined'
      ? `${window.location.protocol.startsWith('https') ? 'https' : 'http'}://${window.location.hostname}:3101`
      : 'http://localhost:3101');
  return url;
}

export class SocketIOService {
  private static socket: Socket | null = null;
  private static url: string = resolveSocketUrl();

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

      const emitStatus = (payload: any) => {
        this.socket?.emit('__client_status__', payload);
      };

      this.socket.on('connect', () => emitStatus({ status: 'connected' }));
      this.socket.on('disconnect', (reason) =>
        emitStatus({ status: 'disconnected', reason })
      );
      this.socket.on('connect_error', (error) =>
        emitStatus({ status: 'error', error })
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

  static on<T = any>(event: string, callback: (data: T) => void): void {
    this.ensure().on(event, callback as any);
  }

  static off(event: string, callback?: (data: any) => void): void {
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
