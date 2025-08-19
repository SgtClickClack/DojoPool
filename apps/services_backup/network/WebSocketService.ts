// Stub WebSocketService - temporarily created to resolve build issues
export class SocketIOService {
  static reconnect() {
    console.log('WebSocket reconnect called (stub)');
  }

  static disconnect() {
    console.log('WebSocket disconnect called (stub)');
  }

  static subscribe(event: string, callback: (data: any) => void) {
    console.log(`WebSocket subscribe to ${event} called (stub)`);
    // Return a no-op unsubscribe function
    return () => {
      console.log(`WebSocket unsubscribe from ${event} called (stub)`);
    };
  }
}
