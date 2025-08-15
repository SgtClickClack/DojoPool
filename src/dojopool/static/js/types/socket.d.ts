declare module "socket.io-client" {
  import { Socket as ClientSocket } from "socket.io-client/build/esm/socket";

  export interface ManagerOptions {
    reconnectionDelayMax?: number;
    reconnectionAttempts?: number;
    autoConnect?: boolean;
    transports?: string[];
    timeout?: number;
  }

  export interface Socket extends ClientSocket {
    connected: boolean;
    disconnected: boolean;
    io: any;
  }

  export function io(uri: string, opts?: Partial<ManagerOptions>): Socket;
}

// Extend the Window interface to include our global variables
declare global {
  interface Window {
    socketManager: any;
    venueManager: any;
    venueDetailsManager: any;
  }
}
