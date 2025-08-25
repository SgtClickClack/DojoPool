// Centralized URL resolution for API and realtime (WebSocket/Socket.IO)
// Frontend-only safe helpers that derive URLs from env or window location.

type NullableString = string | undefined;

function readEnv(keys: string[]): NullableString {
  for (const key of keys) {
    const value = (process as any)?.env?.[key] as NullableString;
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeHttpToWs(url: string): string {
  return url.replace(/^http(s)?:\/\//, 'ws$1://');
}

export function getApiBaseUrl(): string {
  const explicit = readEnv([
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_API_URL',
    'VITE_API_URL',
    'VITE_NEXT_PUBLIC_API_URL',
  ]);

  if (explicit) return explicit;

  if (typeof window !== 'undefined') {
    // Default to same origin for SSR/CSR apps with API proxied under /api
    return `${window.location.protocol}//${window.location.host}`;
  }

  // Node fallback used only in dev tooling contexts
  return 'http://localhost:8080';
}

export function getWebSocketBaseUrl(): string {
  const explicit = readEnv([
    'NEXT_PUBLIC_WS_BASE_URL',
    'NEXT_PUBLIC_WEBSOCKET_URL',
    'NEXT_PUBLIC_WS_URL',
    'NEXT_PUBLIC_SOCKET_URL',
    'VITE_WEBSOCKET_URL',
    'VITE_SOCKET_URL',
  ]);

  if (explicit)
    return explicit.startsWith('http') ? normalizeHttpToWs(explicit) : explicit;

  if (typeof window !== 'undefined') {
    // Derive ws(s) from current location
    const isHttps = window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss' : 'ws';
    return `${wsProto}://${window.location.host}`;
  }

  // Node fallback for local dev
  return 'ws://localhost:8080';
}

export function getSocketIOUrl(): string {
  const wsBase = getWebSocketBaseUrl();
  // Socket.IO typically uses http(s) scheme; convert if needed
  if (wsBase.startsWith('ws://') || wsBase.startsWith('wss://')) {
    return wsBase.replace(/^ws(s)?:\/\//, 'http$1://');
  }
  return wsBase;
}
