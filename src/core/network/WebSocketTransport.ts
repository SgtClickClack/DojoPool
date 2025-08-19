import WebSocket from 'ws';
import {
  type NetworkMessage,
  NetworkMessageType,
  type NetworkTransport,
} from './types';
import { EventEmitter } from 'events';

export class WebSocketTransport implements NetworkTransport {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly nodeId: string;
  private readonly events = new EventEmitter();

  constructor(url: string, nodeId: string) {
    console.log('[WebSocketTransport] constructor called with url:', url);
    this.url = url;
    this.nodeId = nodeId;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(
        '[WebSocketTransport] Instantiating WebSocket with url:',
        this.url
      );
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.events.emit('connect');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString()) as NetworkMessage;
          this.events.emit('message', message);
        } catch (error) {
          this.events.emit('error', new Error('Failed to parse message'));
        }
      });

      this.ws.on('error', (error) => {
        this.events.emit('error', error);
        reject(error);
      });

      this.ws.on('close', () => {
        this.events.emit('disconnect');
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async send<T>(
    target: string,
    message: Omit<NetworkMessage<T>, 'source' | 'timestamp'>
  ): Promise<void> {
    if (!this.ws) {
      throw new Error('Not connected');
    }

    const fullMessage: NetworkMessage<T> = {
      ...message,
      source: this.nodeId,
      target,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(fullMessage));
  }

  async broadcast<T>(
    message: Omit<NetworkMessage<T>, 'source' | 'timestamp' | 'target'>
  ): Promise<void> {
    if (!this.ws) {
      throw new Error('Not connected');
    }

    const fullMessage: NetworkMessage<T> = {
      ...message,
      source: this.nodeId,
      target: '*',
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(fullMessage));
  }

  onMessage(handler: (message: NetworkMessage) => void): void {
    this.events.on('message', handler);
  }

  onError(handler: (err: Error) => void): void {
    this.events.on('error', handler);
  }
}
